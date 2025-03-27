/**
 * VDB file importer
 * Handles loading VDB volumes from file formats
 */
import { Vec3, Material } from '../core/types';
import { 
    VDBVolume, 
    VDBVolumeType,
    VDB_CONFIG,
    VDBFileHeader,
  } from '../type/vdbTypes';
  
import {
    createEmptyInternalNode,
    createEmptyLeafNode,
    createCoordKey,
    getChildBitIndex,
    getLocalKey,
    setBit,
    sphereSDF,
    posToIndex
  } from '../util/vdbUtils';

/**
 * Load a VDB file from an ArrayBuffer
 */
export async function loadVDBFile(buffer: ArrayBuffer): Promise<VDBVolume[]> {
  try {
    // Parse the header
    const header = parseVDBHeader(buffer);
    console.log(`VDB file format version ${header.version} with ${header.volumeCount} volumes`);
    
    // Parse each volume
    const volumes: VDBVolume[] = [];
    
    // In a real implementation, we'd read the actual volumes from the file
    // For now, we'll just create a single test volume
    volumes.push(createTestVolume());
    
    return volumes;
  } catch (error) {
    console.error("Error loading VDB file:", error);
    throw error;
  }
}

/**
 * Parse the VDB file header
 */
function parseVDBHeader(buffer: ArrayBuffer): VDBFileHeader {
  const view = new DataView(buffer);
  
  // Check magic number "VOXL"
  const magic = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3)
  );
  
  if (magic !== "VOXL") {
    // Check for OpenVDB format
    if (magic === "VDB\0") {
      throw new Error("OpenVDB format detected. Use the OpenVDBImporter instead.");
    }
    throw new Error(`Invalid VDB file format: ${magic}`);
  }
  
  // Read the header fields
  const header: VDBFileHeader = {
    magic,
    version: view.getUint32(4, true),
    volumeCount: view.getUint32(8, true),
    flags: view.getUint32(12, true)
  };
  
  return header;
}

/**
 * Create a test volume (for development/testing)
 */
export function createTestVolume(): VDBVolume {
  // Create metadata
  const volume: VDBVolume = {
    name: "TestSphere",
    uuid: `test-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    transform: [...VDB_CONFIG.DEFAULT_TRANSFORM] as any,
    worldBounds: {
      min: [-10, -10, -10],
      max: [10, 10, 10],
    },
    resolution: 0.25, // 0.25 units per voxel
    materials: [createDefaultMaterial()],
    root: { nodes: new Map() },
    volumeType: VDBVolumeType.STATIC
  };
  
  // Populate with a sphere
  populateWithSphere(volume, [0, 0, 0], 8);
  
  // Calculate accurate bounds
  updateVolumeBounds(volume);
  
  return volume;
}

/**
 * Create a default material
 */
function createDefaultMaterial(): Material {
  return {
    id: 0,
    albedo: [0.8, 0.8, 0.8],
    metallic: 0.0,
    roughness: 0.5,
    emission: [0, 0, 0]
  };
}

/**
 * Populate a volume with a sphere
 */
function populateWithSphere(volume: VDBVolume, center: Vec3, radius: number): void {
  // Calculate grid bounds that need populating
  const minX = Math.floor(center[0] - radius - 2 * volume.resolution);
  const minY = Math.floor(center[1] - radius - 2 * volume.resolution);
  const minZ = Math.floor(center[2] - radius - 2 * volume.resolution);
  const maxX = Math.ceil(center[0] + radius + 2 * volume.resolution);
  const maxY = Math.ceil(center[1] + radius + 2 * volume.resolution);
  const maxZ = Math.ceil(center[2] + radius + 2 * volume.resolution);
  
  // Calculate the node dimensions
  const leafDim = VDB_CONFIG.LEAF_DIM * volume.resolution;
  const internalDim = VDB_CONFIG.INTERNAL_DIM * leafDim;
  
  // For each leaf node that might contain the sphere surface
  for (let leafX = Math.floor(minX / leafDim) * leafDim; leafX <= maxX; leafX += leafDim) {
    for (let leafY = Math.floor(minY / leafDim) * leafDim; leafY <= maxY; leafY += leafDim) {
      for (let leafZ = Math.floor(minZ / leafDim) * leafDim; leafZ <= maxZ; leafZ += leafDim) {
        // Check if this leaf node intersects with the sphere + narrow band
        const leafCenter: Vec3 = [
          leafX + leafDim/2,
          leafY + leafDim/2,
          leafZ + leafDim/2
        ];
        
        const distToSphere = Math.abs(
          Math.sqrt(
            (leafCenter[0] - center[0])**2 + 
            (leafCenter[1] - center[1])**2 + 
            (leafCenter[2] - center[2])**2
          ) - radius
        );
        
        // Skip if leaf is too far from sphere surface
        if (distToSphere > leafDim * Math.sqrt(3) / 2 + volume.resolution) {
          continue;
        }
        
        // Create the leaf node
        const leafOrigin: Vec3 = [leafX, leafY, leafZ];
        const leafNode = createEmptyLeafNode(leafOrigin);
        
        // Find or create the parent internal node
        const internalOrigin: Vec3 = [
          Math.floor(leafX / internalDim) * internalDim,
          Math.floor(leafY / internalDim) * internalDim,
          Math.floor(leafZ / internalDim) * internalDim
        ];
        
        const internalKey = createCoordKey(internalOrigin[0], internalOrigin[1], internalOrigin[2]);
        let internalNode = volume.root.nodes.get(internalKey);
        
        if (!internalNode) {
          internalNode = createEmptyInternalNode(internalOrigin);
          volume.root.nodes.set(internalKey, internalNode);
        }
        
        // Check if any voxels in this leaf are active
        let hasActiveVoxels = false;
        
        // Populate the leaf with sphere SDF
        for (let localZ = 0; localZ < VDB_CONFIG.LEAF_DIM; localZ++) {
          for (let localY = 0; localY < VDB_CONFIG.LEAF_DIM; localY++) {
            for (let localX = 0; localX < VDB_CONFIG.LEAF_DIM; localX++) {
              const worldX = leafOrigin[0] + localX * volume.resolution;
              const worldY = leafOrigin[1] + localY * volume.resolution;
              const worldZ = leafOrigin[2] + localZ * volume.resolution;
              
              // Calculate SDF value
              const sdf = sphereSDF([worldX, worldY, worldZ], center, radius);
              
              // Only store narrow band voxels
              const isActive = Math.abs(sdf) < 2 * volume.resolution;
              
              if (isActive) {
                hasActiveVoxels = true;
                
                // Calculate index and set the bit
                const index = posToIndex(localX, localY, localZ, VDB_CONFIG.LEAF_DIM);
                setBit(leafNode.activeMask, index);
                
                // Store voxel data
                leafNode.values[index] = {
                  density: sdf,
                  materialId: 0
                };
              }
            }
          }
        }
        
        // Only add leaf if it has active voxels
        if (hasActiveVoxels) {
          // Add leaf to internal node
          const leafKey = getLocalKey(leafOrigin, internalOrigin);
          
          // Update child mask
          const bitIndex = getChildBitIndex(leafOrigin, internalOrigin);
          setBit(internalNode.childMask, bitIndex);
          
          // Add to children map
          internalNode.children.set(leafKey, leafNode);
        }
      }
    }
  }
}

/**
 * Update the bounding box of a volume based on its contents
 */
function updateVolumeBounds(volume: VDBVolume): void {
  if (volume.root.nodes.size === 0) {
    return;
  }
  
  const bounds = {
    min: [Infinity, Infinity, Infinity] as Vec3,
    max: [-Infinity, -Infinity, -Infinity] as Vec3
  };
  
  // Iterate through all internal nodes
  for (const internalNode of volume.root.nodes.values()) {
    // Update bounds with internal node origin
    for (let i = 0; i < 3; i++) {
      bounds.min[i] = Math.min(bounds.min[i], internalNode.origin[i]);
      bounds.max[i] = Math.max(
        bounds.max[i], 
        internalNode.origin[i] + VDB_CONFIG.INTERNAL_DIM * VDB_CONFIG.LEAF_DIM * volume.resolution
      );
    }
    
    // Iterate through leaf nodes
    for (const leafNode of internalNode.children.values()) {
      // Update bounds with leaf node
      for (let i = 0; i < 3; i++) {
        bounds.min[i] = Math.min(bounds.min[i], leafNode.origin[i]);
        bounds.max[i] = Math.max(
          bounds.max[i], 
          leafNode.origin[i] + VDB_CONFIG.LEAF_DIM * volume.resolution
        );
      }
    }
  }
  
  // Add some padding
  for (let i = 0; i < 3; i++) {
    bounds.min[i] -= volume.resolution;
    bounds.max[i] += volume.resolution;
  }
  
  volume.worldBounds = bounds;
}

  /**
* Converts a linear index to a 3D position
* @param index The linear index
* @param dimensions The dimensions of the 3D grid
* @returns The 3D position as [x, y, z]
*/
export function indexToPos(index: number, dimensions: Vec3): Vec3 {
  const x = index % dimensions[0];
  const y = Math.floor(index / dimensions[0]) % dimensions[1];
  const z = Math.floor(index / (dimensions[0] * dimensions[1]));
  return [x, y, z];
}

/**
 * Debug utility to print volume information
 */
export function printVolumeInfo(volume: VDBVolume): void {
  console.log(`Volume: ${volume.name} (${volume.uuid})`);
  console.log(`Type: ${volume.volumeType}`);
  console.log(`Created: ${volume.createdAt.toISOString()}`);
  console.log(`Bounds: [${volume.worldBounds.min}] to [${volume.worldBounds.max}]`);
  console.log(`Resolution: ${volume.resolution}`);
  
  // Count nodes
  let internalNodeCount = volume.root.nodes.size;
  let leafNodeCount = 0;
  let activeVoxelCount = 0;
  
  for (const internalNode of volume.root.nodes.values()) {
    leafNodeCount += internalNode.children.size;
    
    for (const leafNode of internalNode.children.values()) {
      // Count active voxels
      for (let i = 0; i < leafNode.activeMask.length; i++) {
        let mask = leafNode.activeMask[i];
        while (mask) {
          if (mask & 1) activeVoxelCount++;
          mask >>>= 1;
        }
      }
    }
  }
  
  console.log(`Internal Nodes: ${internalNodeCount}`);
  console.log(`Leaf Nodes: ${leafNodeCount}`);
  console.log(`Active Voxels: ${activeVoxelCount}`);
  
  // Calculate compression ratio
  const totalVoxels = 
    Math.ceil((volume.worldBounds.max[0] - volume.worldBounds.min[0]) / volume.resolution) *
    Math.ceil((volume.worldBounds.max[1] - volume.worldBounds.min[1]) / volume.resolution) *
    Math.ceil((volume.worldBounds.max[2] - volume.worldBounds.min[2]) / volume.resolution);
  
  console.log(`Total Possible Voxels: ${totalVoxels}`);
  console.log(`Compression Ratio: ${(totalVoxels / activeVoxelCount).toFixed(2)}:1`);
}