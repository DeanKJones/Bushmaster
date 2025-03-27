/**
 * Manager for .vox models
 * Handles loading, storing and converting MagicaVoxel models
 */
import { 
    importVoxFile, 
    convertVoxModelToVDBVolume, 
    analyzeVoxModel,
    createTestVoxModel
  } from './import/voxImporter';
  import { ConvertedVoxModel } from './type/voxTypes';
  import { VDBManager } from './vdbManager';
  import { EventSystem } from '../events/eventSystem';
  import { Vec3 } from './type/vdbTypes';
  
  /**
   * Manages MagicaVoxel .vox models
   */
  export class VoxManager {
    private static instance: VoxManager;
    
    // Storage for imported models
    private models: Map<string, ConvertedVoxModel> = new Map();
    
    // Reference to VDB manager for conversion
    private vdbManager: VDBManager;
    
    // Event system for notifications
    private eventSystem: EventSystem;
    
    private constructor() {
      this.vdbManager = VDBManager.getInstance();
      this.eventSystem = EventSystem.getInstance();
      console.log('VoxManager initialized');
    }
    
    /**
     * Get the singleton instance
     */
    public static getInstance(): VoxManager {
      if (!VoxManager.instance) {
        VoxManager.instance = new VoxManager();
      }
      return VoxManager.instance;
    }
    
    /**
     * Import a .vox file from an ArrayBuffer
     * @param buffer ArrayBuffer containing .vox data
     * @param baseName Base name for the imported models
     * @returns Array of model IDs for the imported models
     */
    public async importVoxFromBuffer(
      buffer: ArrayBuffer, 
      baseName: string = 'vox_model'
    ): Promise<string[]> {
      try {
        const models = await importVoxFile(buffer, baseName);
        const modelIds: string[] = [];
        
        for (const model of models) {
          const modelId = `${model.name}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          this.models.set(modelId, model);
          modelIds.push(modelId);
          
          // Emit event for model loaded
          this.eventSystem.emit('vox:model-loaded', { 
            modelId, 
            name: model.name 
          });
          
          // Analyze the model
          analyzeVoxModel(model);
        }
        
        console.log(`Loaded ${models.length} models from .vox file`);
        return modelIds;
      } catch (error) {
        console.error('Failed to load .vox file:', error);
        throw error;
      }
    }
    
    /**
     * Create a test VOX model
     * @returns ID of the created model
     */
    public createTestModel(): string {
      const model = createTestVoxModel();
      const modelId = `${model.name}_${Date.now()}`;
      
      this.models.set(modelId, model);
      
      // Emit event for model created
      this.eventSystem.emit('vox:model-created', {
        modelId,
        name: model.name
      });
      
      console.log('Created test VOX model:', modelId);
      analyzeVoxModel(model);
      
      return modelId;
    }
    
    /**
     * Convert a VOX model to a VDB volume
     * @param modelId ID of the model to convert
     * @param resolution Resolution for the VDB volume
     * @returns ID of the created VDB volume, or null if conversion failed
     */
    public convertModelToVDBVolume(
      modelId: string,
      resolution: number = 0.1
    ): string | null {
      const model = this.models.get(modelId);
      if (!model) {
        console.error(`Model not found: ${modelId}`);
        return null;
      }
      
      try {
        // Convert to VDB
        console.log(`Converting model '${model.name}' to VDB volume...`);
        const volume = convertVoxModelToVDBVolume(model, resolution);
        
        // Add to VDB manager
        this.vdbManager.addVolume(volume);
        
        // Emit event for model converted
        this.eventSystem.emit('vox:model-converted', {
          modelId,
          volumeId: volume.uuid,
          name: volume.name
        });
        
        console.log(`Converted model '${model.name}' to VDB volume: ${volume.uuid}`);
        return volume.uuid;
      } catch (error) {
        console.error(`Failed to convert model '${model.name}' to VDB:`, error);
        return null;
      }
    }
    
    /**
     * Get a model by ID
     * @param modelId ID of the model
     * @returns The model, or undefined if not found
     */
    public getModel(modelId: string): ConvertedVoxModel | undefined {
      return this.models.get(modelId);
    }
    
    /**
     * Get all loaded models
     * @returns Map of all models
     */
    public getAllModels(): Map<string, ConvertedVoxModel> {
      return this.models;
    }
    
    /**
     * Get summary information for all models
     * @returns Array of model summary objects
     */
    public getModelSummaries(): Array<{
      id: string,
      name: string,
      dimensions: Vec3,
      voxelCount: number
    }> {
      const summaries = [];
      
      for (const [id, model] of this.models.entries()) {
        summaries.push({
          id,
          name: model.name,
          dimensions: model.dimensions,
          voxelCount: model.voxels.size
        });
      }
      
      return summaries;
    }
    
    /**
     * Delete a model
     * @param modelId ID of the model to delete
     * @returns True if successful, false if model not found
     */
    public deleteModel(modelId: string): boolean {
      if (!this.models.has(modelId)) {
        return false;
      }
      
      // Delete the model
      this.models.delete(modelId);
      this.eventSystem.emit('vox:model-deleted', { modelId });
      
      return true;
    }
    
    /**
     * Clear all models
     */
    public clearAllModels(): void {
      this.models.clear();
      this.eventSystem.emit('vox:all-models-cleared', {});
    }
    
    /**
     * Get the count of models
     */
    public getModelCount(): number {
      return this.models.size;
    }
  }