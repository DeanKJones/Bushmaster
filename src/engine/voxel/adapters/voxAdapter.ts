import { ConvertedVoxModel } from '../type/voxTypes';
import { HashVoxelModel } from '../core/hashVoxelModel';
import { 
  VoxelData, 
  VoxelModelType, 
  VoxelSourceFormat,
  Material 
} from '../core/types';
import { importVoxFile, createTestVoxModel } from '../import/voxImporter';

/**
 * Adapter for converting VOX format models to the unified voxel format
 */
export class VoxAdapter {
  /**
   * Import a VOX file from a buffer and convert to the unified format
   * @param buffer The .vox file data
   * @param baseName Base name for the models
   * @returns Array of created voxel models
   */
  public static async importFromBuffer(
    buffer: ArrayBuffer, 
    baseName: string = 'vox_model'
  ): Promise<HashVoxelModel[]> {
    // Use the existing VOX importer to parse the file
    const voxModels = await importVoxFile(buffer, baseName);
    
    // Convert each model to our unified format
    return voxModels.map(model => VoxAdapter.convertToUnifiedFormat(model));
  }
  
  /**
   * Create a test VOX model in the unified format
   * @returns A test voxel model
   */
  public static createTestModel(): HashVoxelModel {
    const testVoxModel = createTestVoxModel();
    return VoxAdapter.convertToUnifiedFormat(testVoxModel);
  }
  
  /**
   * Convert a VOX model to our unified format
   * @param voxModel The VOX model to convert
   * @returns A unified voxel model
   */
  public static convertToUnifiedFormat(voxModel: ConvertedVoxModel): HashVoxelModel {
    // Create a new hash-based voxel model
    const model = new HashVoxelModel({
      name: voxModel.name,
      modelType: VoxelModelType.DISCRETE, // VOX files are discrete voxels
      sourceFormat: VoxelSourceFormat.VOX,
      dimensions: voxModel.dimensions,
      origin: voxModel.origin,
      resolution: 0.1, // Default resolution for VOX models
      materials: voxModel.materials.map(VoxAdapter.convertMaterial)
    });
    
    // Convert and add all voxels
    for (const [key, voxelData] of voxModel.voxels.entries()) {
      const [x, y, z] = key.split(',').map(Number);
      
      const unifiedVoxel: VoxelData = {
        colorIndex: voxelData.colorIndex,
        materialId: voxelData.materialIndex
      };
      
      model.setVoxelAt(x, y, z, unifiedVoxel);
    }
    
    return model;
  }
  
  /**
   * Convert a VOX material to our unified material format
   * @param voxMaterial The VOX material to convert
   * @returns A unified material
   */
  private static convertMaterial(voxMaterial: Material): Material {
    // VOX materials can be used directly since they match our format
    return {
      ...voxMaterial
    };
  }
}