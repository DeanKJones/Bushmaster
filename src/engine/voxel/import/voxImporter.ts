/**
 * Importer for MagicaVoxel .vox files
 * Converts .vox models to VDB format for use in the engine
 */
import { parseVoxFile } from './voxParser';
import { convertToVDBFormat, createVoxelKey, parseVoxelKey, isVoxelOnBoundary } from '../util/voxUtils';
import { ConvertedVoxModel } from '../type/voxTypes';
import { 
  VDBVolume, 
  Vec3, 
  VDBVolumeType,
  //VDBRoot, 
  //VDBLeafNode, 
  //VDBInternalNode,
  VoxelData,
  VDB_CONFIG
} from '../type/vdbTypes';
import {
  createEmptyLeafNode,
  createEmptyInternalNode,
  setBit,
  getChildBitIndex,
  getLocalKey
} from '../util/vdbUtils';

/**
 * Import a .vox file from an ArrayBuffer
 * @param buffer ArrayBuffer containing .vox file data
 * @param modelName Optional name for the model
 * @returns Converted model data
 */
export async function importVoxFile(
  buffer: ArrayBuffer, 
  modelName: string = 'vox_model'
): Promise<ConvertedVoxModel[]> {
  try {
    // Parse the .vox file
    const voxFile = parseVoxFile(buffer);
    console.log(`Parsed .vox file with ${voxFile.models.length} models`);
    
    // Convert each model
    const convertedModels: ConvertedVoxModel[] = [];
    
    for (let i = 0; i < voxFile.models.length; i++) {
      const model = voxFile.models[i];
      
      // Create model data for conversion
      const modelData = {
        dimensions: [model.sizeX, model.sizeY, model.sizeZ] as Vec3,
        voxels: new Map<string, number>(),
        palette: model.palette,
        materials: model.materials
      };
      
      // Add voxels
      for (const voxel of model.voxels) {
        if (voxel.colorIndex > 0) { // Skip transparent voxels
          const key = createVoxelKey(voxel.x, voxel.y, voxel.z);
          modelData.voxels.set(key, voxel.colorIndex);
        }
      }
      
      // Convert to our format
      const name = voxFile.models.length > 1 ? `${modelName}_${i + 1}` : modelName;
      const convertedModel = convertToVDBFormat(modelData, name);
      convertedModels.push(convertedModel);
    }
    
    return convertedModels;
  } catch (error) {
    console.error('Failed to import .vox file:', error);
    throw error;
  }
}

/**
 * Convert a vox model to a VDB volume
 * @param model Converted vox model
 * @param resolution Optional resolution for the VDB volume
 * @returns VDB volume representation of the model
 */
export function convertVoxModelToVDBVolume(
  model: ConvertedVoxModel, 
  resolution: number = 0.1
): VDBVolume {
  const uuid = `vox-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  // Create volume object
  const volume: VDBVolume = {
    name: model.name,
    uuid,
    createdAt: new Date(),
    updatedAt: new Date(),
    transform: [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ],
    worldBounds: {
      min: [0, 0, 0],
      max: [0, 0, 0]
    },
    resolution,
    materials: model.materials,
    root: { nodes: new Map() },
    volumeType: VDBVolumeType.STATIC
  };
  
  // Calculate world bounds
  volume.worldBounds = {
    min: [
      model.origin[0] - resolution,
      model.origin[1] - resolution,
      model.origin[2] - resolution
    ],
    max: [
      model.origin[0] + model.dimensions[0] * resolution + resolution,
      model.origin[1] + model.dimensions[1] * resolution + resolution,
      model.origin[2] + model.dimensions[2] * resolution + resolution
    ]
  };
  
  // Group voxels into leaf nodes
  const leafMap = new Map<string, VoxelData[]>();
  const leafDimVoxels = VDB_CONFIG.LEAF_DIM;
  const leafDimWorld = leafDimVoxels * resolution;
  
  // Convert voxels to VDB structure
  for (const [voxelKey, voxelData] of model.voxels.entries()) {
    const [x, y, z] = parseVoxelKey(voxelKey);
    
    // Get leaf node coordinates (floor to nearest leaf size)
    const leafX = Math.floor(x / leafDimVoxels) * leafDimVoxels;
    const leafY = Math.floor(y / leafDimVoxels) * leafDimVoxels;
    const leafZ = Math.floor(z / leafDimVoxels) * leafDimVoxels;
    
    // Convert to world coordinates
    const worldLeafX = model.origin[0] + leafX * resolution;
    const worldLeafY = model.origin[1] + leafY * resolution;
    const worldLeafZ = model.origin[2] + leafZ * resolution;
    
    // Get or create leaf array
    const leafKey = `${worldLeafX},${worldLeafY},${worldLeafZ}`;
    if (!leafMap.has(leafKey)) {
      leafMap.set(leafKey, new Array(leafDimVoxels * leafDimVoxels * leafDimVoxels));
    }
    
    // Calculate local position within leaf
    const localX = x - leafX;
    const localY = y - leafY;
    const localZ = z - leafZ;
    
    // Calculate linear index in the leaf array
    const index = localX + localY * leafDimVoxels + localZ * leafDimVoxels * leafDimVoxels;
    
    // Check if this voxel is on the boundary
    const onBoundary = isVoxelOnBoundary(x, y, z, model.voxels, model.dimensions);
    
    // Store voxel data
    const voxelValue: VoxelData = {
      density: onBoundary ? 0.0 : -resolution, // Surface or interior
      materialId: voxelData.materialIndex
    };
    
    // Add to leaf
    leafMap.get(leafKey)![index] = voxelValue;
  }
  
  // Create leaf nodes and organize into internal nodes
  for (const [leafKey, voxelValues] of leafMap.entries()) {
    const [worldLeafX, worldLeafY, worldLeafZ] = leafKey.split(',').map(Number);
    
    // Create leaf node
    const leafOrigin: Vec3 = [worldLeafX, worldLeafY, worldLeafZ];
    const leafNode = createEmptyLeafNode(leafOrigin);
    
    // Add voxels to leaf node
    for (let i = 0; i < voxelValues.length; i++) {
      const voxel = voxelValues[i];
      if (voxel) {
        setBit(leafNode.activeMask, i);
        leafNode.values[i] = voxel;
      }
    }
    
    // Get parent internal node coordinates (floor to nearest internal size)
    const internalDimWorld = VDB_CONFIG.INTERNAL_DIM * leafDimWorld;
    
    const internalX = Math.floor(worldLeafX / internalDimWorld) * internalDimWorld;
    const internalY = Math.floor(worldLeafY / internalDimWorld) * internalDimWorld;
    const internalZ = Math.floor(worldLeafZ / internalDimWorld) * internalDimWorld;
    
    // Get or create internal node
    const internalKey = `${internalX},${internalY},${internalZ}`;
    let internalNode = volume.root.nodes.get(internalKey);
    
    if (!internalNode) {
      internalNode = createEmptyInternalNode([internalX, internalY, internalZ]);
      volume.root.nodes.set(internalKey, internalNode);
    }
    
    // Add leaf to internal node
    const leafLocalKey = getLocalKey(leafOrigin, internalNode.origin);
    const childBitIndex = getChildBitIndex(leafOrigin, internalNode.origin);
    setBit(internalNode.childMask, childBitIndex);
    internalNode.children.set(leafLocalKey, leafNode);
  }
  
  return volume;
}

/**
 * Analyze a vox model and print information about it
 */
export function analyzeVoxModel(model: ConvertedVoxModel): void {
  console.log(`--- VOX Model Analysis: ${model.name} ---`);
  console.log(`Dimensions: ${model.dimensions[0]} × ${model.dimensions[1]} × ${model.dimensions[2]}`);
  console.log(`Origin: ${model.origin[0]}, ${model.origin[1]}, ${model.origin[2]}`);
  console.log(`Total voxels: ${model.voxels.size}`);
  
  // Count voxels by color
  const colorCounts = new Map<number, number>();
  for (const voxel of model.voxels.values()) {
    const colorIndex = voxel.colorIndex;
    colorCounts.set(colorIndex, (colorCounts.get(colorIndex) || 0) + 1);
  }
  
  console.log(`Color distribution:`);
  for (const [colorIndex, count] of colorCounts.entries()) {
    const percentage = ((count / model.voxels.size) * 100).toFixed(1);
    console.log(`  Color ${colorIndex}: ${count} voxels (${percentage}%)`);
  }
  
  console.log(`Materials: ${model.materials.length}`);
  console.log('-------------------------------------');
}

/**
 * Load a test vox model (simple cube)
 */
export function createTestVoxModel(): ConvertedVoxModel {
  // Create a simple 8x8x8 cube model
  const dimensions: Vec3 = [8, 8, 8];
  const voxels = new Map<string, { colorIndex: number, materialIndex: number }>();
  
  // Create the cube with different colors for each face
  for (let x = 0; x < dimensions[0]; x++) {
    for (let y = 0; y < dimensions[1]; y++) {
      for (let z = 0; z < dimensions[2]; z++) {
        // Only create voxels on the surface
        if (x === 0 || x === dimensions[0] - 1 || 
            y === 0 || y === dimensions[1] - 1 || 
            z === 0 || z === dimensions[2] - 1) {
          
          // Determine color based on face
          let colorIndex = 1; // Default red
          let materialIndex = 0;
          
          if (x === 0) colorIndex = 1; // Red (X-)
          else if (x === dimensions[0] - 1) colorIndex = 2; // Green (X+)
          else if (y === 0) colorIndex = 3; // Blue (Y-)
          else if (y === dimensions[1] - 1) colorIndex = 4; // Yellow (Y+)
          else if (z === 0) colorIndex = 5; // Cyan (Z-)
          else if (z === dimensions[2] - 1) colorIndex = 6; // Magenta (Z+)
          
          // Create the voxel
          const key = createVoxelKey(x, y, z);
          voxels.set(key, { colorIndex, materialIndex });
        }
      }
    }
  }
  
  // Create materials based on colors
  const palette = [
    0x00000000, // Transparent
    0xFF0000FF, // Red
    0xFF00FF00, // Green
    0xFFFF0000, // Blue
    0xFF00FFFF, // Yellow
    0xFFFFFF00, // Cyan
    0xFFFF00FF, // Magenta
    0xFFFFFFFF  // White
  ];
  
  // Create materials
  const materials = [
    {
      id: 0,
      albedo: [1.0, 0.0, 0.0] as Vec3, // Red
      metallic: 0.0,
      roughness: 0.5,
      emission: [0, 0, 0] as Vec3
    },
    {
      id: 1,
      albedo: [0.0, 1.0, 0.0] as Vec3, // Green
      metallic: 0.0,
      roughness: 0.5,
      emission: [0, 0, 0] as Vec3
    },
    {
      id: 2,
      albedo: [0.0, 0.0, 1.0] as Vec3, // Blue
      metallic: 0.0,
      roughness: 0.5,
      emission: [0, 0, 0] as Vec3
    },
    {
      id: 3,
      albedo: [1.0, 1.0, 0.0] as Vec3, // Yellow
      metallic: 0.0,
      roughness: 0.5,
      emission: [0, 0, 0] as Vec3
    },
    {
      id: 4,
      albedo: [0.0, 1.0, 1.0] as Vec3, // Cyan
      metallic: 0.0,
      roughness: 0.5,
      emission: [0, 0, 0] as Vec3
    },
    {
      id: 5,
      albedo: [1.0, 0.0, 1.0] as Vec3, // Magenta
      metallic: 0.0,
      roughness: 0.5,
      emission: [0, 0, 0] as Vec3
    }
  ];
  
  return {
    name: 'TestCube',
    dimensions,
    origin: [-4, -4, -4], // Center at origin
    voxels,
    palette,
    materials
  };
}