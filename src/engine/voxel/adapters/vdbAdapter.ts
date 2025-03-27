import { HashVoxelModel } from '../core/hashVoxelModel';
import { 
  Vec3,
  VoxelData, 
  VoxelModelType, 
  VoxelSourceFormat 
} from '../core/types';
import { 
  VDBVolume, 
  VDBLeafNode,
  VDBInternalNode,
  VoxelData as VDBVoxelData 
} from '../type/vdbTypes';
import {  
  createTestVolume,
  loadVDBFile,
  indexToPos,
} from '../import/vdbImporter';

/**
 * Adapter for converting VDB format models to the unified voxel format
 */
export class VdbAdapter {
  /**
   * Import a VDB file from a buffer and convert to the unified format
   * @param buffer The .vdb file data
   * @returns Array of created voxel models
   */
  public static async importFromBuffer(buffer: ArrayBuffer): Promise<HashVoxelModel[]> {
    // Use the existing VDB importer to parse the file
    const vdbVolumes = await loadVDBFile(buffer);
    
    // Convert each volume to our unified format
    return vdbVolumes.map(volume => VdbAdapter.convertToUnifiedFormat(volume));
  }
  
  /**
   * Create a test VDB model in the unified format
   * @returns A test voxel model
   */
  public static createTestModel(): HashVoxelModel {
    const testVdbVolume = createTestVolume();
    return VdbAdapter.convertToUnifiedFormat(testVdbVolume);
  }
  
  /**
   * Convert a VDB volume to our unified format
   * @param vdbVolume The VDB volume to convert
   * @returns A unified voxel model
   */
  public static convertToUnifiedFormat(vdbVolume: VDBVolume): HashVoxelModel {
    // Create a new hash-based voxel model
    const model = new HashVoxelModel({
      name: vdbVolume.name,
      modelType: VoxelModelType.SDF, // VDB volumes typically use SDF representation
      sourceFormat: VoxelSourceFormat.VDB,
      origin: [
        vdbVolume.worldBounds.min[0],
        vdbVolume.worldBounds.min[1],
        vdbVolume.worldBounds.min[2]
      ],
      resolution: vdbVolume.resolution,
      materials: vdbVolume.materials
    });
    
    // Calculate dimensions from bounds
    const dimensions = [
      (vdbVolume.worldBounds.max[0] - vdbVolume.worldBounds.min[0]) / vdbVolume.resolution,
      (vdbVolume.worldBounds.max[1] - vdbVolume.worldBounds.min[1]) / vdbVolume.resolution,
      (vdbVolume.worldBounds.max[2] - vdbVolume.worldBounds.min[2]) / vdbVolume.resolution
    ] as Vec3;
    model.dimensions = dimensions;
    
    // Copy the transform
    model.transform = [...vdbVolume.transform];
    
    // Convert VDB tree structure to our unified voxel representation
    VdbAdapter.convertVDBTree(vdbVolume, model);
    
    return model;
  }
  
  /**
   * Convert the VDB tree structure to our unified voxel format
   * @param vdbVolume The source VDB volume
   * @param model The target unified voxel model
   */
  private static convertVDBTree(vdbVolume: VDBVolume, model: HashVoxelModel): void {
    // Process all internal nodes
    for (const internalNode of vdbVolume.root.nodes.values()) {
      VdbAdapter.convertInternalNode(internalNode, vdbVolume.resolution, model);
    }
  }
  
  /**
   * Convert a VDB internal node and its children to our unified voxel format
   * @param internalNode The VDB internal node
   * @param resolution The voxel resolution
   * @param model The target unified voxel model
   */
  private static convertInternalNode(
    internalNode: VDBInternalNode, 
    resolution: number, 
    model: HashVoxelModel
  ): void {
    // Process all leaf nodes in this internal node
    for (const leafNode of internalNode.children.values()) {
      VdbAdapter.convertLeafNode(leafNode, resolution, model);
    }
  }
  
  /**
   * Convert a VDB leaf node to our unified voxel format
   * @param leafNode The VDB leaf node
   * @param resolution The voxel resolution
   * @param model The target unified voxel model
   */
  private static convertLeafNode(
    leafNode: VDBLeafNode, 
    resolution: number, 
    model: HashVoxelModel
  ): void {
    const leafOrigin = leafNode.origin;
    
    // Process all active voxels in this leaf
    for (let i = 0; i < leafNode.activeMask.length; i++) {
      let mask = leafNode.activeMask[i];
      let bitPosition = 0;
      
      // Check each bit in the mask
      while (mask) {
        if (mask & 1) {
          // This voxel is active, get its index
          const voxelIndex = i * 32 + bitPosition;
          
          // Get the voxel data
          const vdbVoxel = leafNode.values[voxelIndex];
          
          // Convert to local coordinates within the leaf
          const leafDim = 8; // Assuming LEAF_DIM = 8
          const localPos = indexToPos(voxelIndex, [leafDim, leafDim, leafDim]);
          
          // Calculate grid coordinates
          const gridX = Math.floor((leafOrigin[0] / resolution) + localPos[0]);
          const gridY = Math.floor((leafOrigin[1] / resolution) + localPos[1]);
          const gridZ = Math.floor((leafOrigin[2] / resolution) + localPos[2]);
          
          // Convert VDB voxel data to our unified format
          const unifiedVoxel = VdbAdapter.convertVoxelData(vdbVoxel);
          
          // Add to the model
          model.setVoxelAt(gridX, gridY, gridZ, unifiedVoxel);
        }
        
        // Move to the next bit
        mask >>>= 1;
        bitPosition++;
      }
    }
  }
  
  /**
   * Convert VDB voxel data to our unified format
   * @param vdbVoxel The VDB voxel data
   * @returns The unified voxel data
   */
  private static convertVoxelData(vdbVoxel: VDBVoxelData): VoxelData {
    return {
      density: vdbVoxel.density,
      materialId: vdbVoxel.materialId
    };
  }
}