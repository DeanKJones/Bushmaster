import { EventSystem } from '../events/eventSystem';
import { HashVoxelModel } from './core/hashVoxelModel';
import { VoxAdapter } from './adapters/voxAdapter';
import { VdbAdapter } from './adapters/vdbAdapter';
import { VoxelModelType, VoxelSourceFormat, Vec3 } from './core/types';

/**
 * Unified manager for all voxel models in the engine
 * Handles importing, creating, and managing voxel data from any source
 */
export class VoxelManager {
  private static instance: VoxelManager;
  
  // Storage for all loaded voxel models
  private models: Map<string, HashVoxelModel> = new Map();
  
  // Active models for rendering
  private activeModels: Set<string> = new Set();
  
  // Event system for notifications
  private eventSystem: EventSystem;
  
  private constructor() {
    this.eventSystem = EventSystem.getInstance();
    console.log('VoxelManager initialized');
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): VoxelManager {
    if (!VoxelManager.instance) {
      VoxelManager.instance = new VoxelManager();
    }
    return VoxelManager.instance;
  }
  
  /**
   * Import a VOX file from an ArrayBuffer
   * @param buffer ArrayBuffer containing VOX data
   * @param baseName Base name for the imported models
   * @returns Array of model IDs for the imported models
   */
  public async importVoxFromBuffer(
    buffer: ArrayBuffer, 
    baseName: string = 'vox_model'
  ): Promise<string[]> {
    try {
      const voxModels = await VoxAdapter.importFromBuffer(buffer, baseName);
      const modelIds: string[] = [];
      
      for (const model of voxModels) {
        this.models.set(model.id, model);
        modelIds.push(model.id);
        
        // Emit event for model loaded
        this.eventSystem.emit('voxel:model-loaded', { 
          modelId: model.id, 
          name: model.name,
          format: VoxelSourceFormat.VOX
        });
      }
      
      console.log(`Loaded ${voxModels.length} models from VOX file`);
      return modelIds;
    } catch (error) {
      console.error('Failed to load VOX file:', error);
      throw error;
    }
  }
  
  /**
   * Import a VDB file from an ArrayBuffer
   * @param buffer ArrayBuffer containing VDB data
   * @returns Array of model IDs for the imported models
   */
  public async importVdbFromBuffer(buffer: ArrayBuffer): Promise<string[]> {
    try {
      const vdbModels = await VdbAdapter.importFromBuffer(buffer);
      const modelIds: string[] = [];
      
      for (const model of vdbModels) {
        this.models.set(model.id, model);
        modelIds.push(model.id);
        
        // Emit event for model loaded
        this.eventSystem.emit('voxel:model-loaded', { 
          modelId: model.id, 
          name: model.name,
          format: VoxelSourceFormat.VDB
        });
      }
      
      console.log(`Loaded ${vdbModels.length} models from VDB file`);
      return modelIds;
    } catch (error) {
      console.error('Failed to load VDB file:', error);
      throw error;
    }
  }
  
  /**
   * Create a test VOX model
   * @returns ID of the created model
   */
  public createTestVoxModel(): string {
    const model = VoxAdapter.createTestModel();
    this.models.set(model.id, model);
    
    // Emit event for model created
    this.eventSystem.emit('voxel:model-created', {
      modelId: model.id,
      name: model.name,
      format: VoxelSourceFormat.VOX
    });
    
    console.log('Created test VOX model:', model.id);
    return model.id;
  }
  
  /**
   * Create a test VDB model
   * @returns ID of the created model
   */
  public createTestVdbModel(): string {
    const model = VdbAdapter.createTestModel();
    this.models.set(model.id, model);
    
    // Emit event for model created
    this.eventSystem.emit('voxel:model-created', {
      modelId: model.id,
      name: model.name,
      format: VoxelSourceFormat.VDB
    });
    
    console.log('Created test VDB model:', model.id);
    return model.id;
  }
  
  /**
   * Get a model by ID
   * @param modelId ID of the model
   * @returns The model, or undefined if not found
   */
  public getModel(modelId: string): HashVoxelModel | undefined {
    return this.models.get(modelId);
  }
  
  /**
   * Get all loaded models
   * @returns Map of all models
   */
  public getAllModels(): Map<string, HashVoxelModel> {
    return this.models;
  }
  
  /**
   * Get summary information for all models
   */
  public getModelSummaries(): Array<{
    id: string,
    name: string,
    type: VoxelModelType,
    format: VoxelSourceFormat,
    dimensions: Vec3,
    voxelCount: number,
    isActive: boolean
  }> {
    const summaries = [];
    
    for (const [id, model] of this.models.entries()) {
      summaries.push({
        id,
        name: model.name,
        type: model.modelType,
        format: model.sourceFormat,
        dimensions: model.dimensions,
        voxelCount: model.getVoxelCount(),
        isActive: this.activeModels.has(id)
      });
    }
    
    return summaries;
  }
  
  /**
   * Activate a model for rendering
   * @param modelId ID of the model to activate
   * @returns True if successful, false if model not found
   */
  public activateModel(modelId: string): boolean {
    if (!this.models.has(modelId)) {
      return false;
    }
    
    this.activeModels.add(modelId);
    this.eventSystem.emit('voxel:model-activated', { modelId });
    return true;
  }
  
  /**
   * Deactivate a model (remove from rendering)
   * @param modelId ID of the model to deactivate
   * @returns True if successful, false if model not found
   */
  public deactivateModel(modelId: string): boolean {
    if (!this.models.has(modelId)) {
      return false;
    }
    
    this.activeModels.delete(modelId);
    this.eventSystem.emit('voxel:model-deactivated', { modelId });
    return true;
  }
  
  /**
   * Get all active models
   * @returns Array of active models
   */
  public getActiveModels(): HashVoxelModel[] {
    return Array.from(this.activeModels).map(id => this.models.get(id)!);
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
    
    // Deactivate first if needed
    if (this.activeModels.has(modelId)) {
      this.deactivateModel(modelId);
    }
    
    // Delete the model
    this.models.delete(modelId);
    this.eventSystem.emit('voxel:model-deleted', { modelId });
    
    return true;
  }
  
  /**
   * Clear all models
   */
  public clearAllModels(): void {
    this.activeModels.clear();
    this.models.clear();
    this.eventSystem.emit('voxel:all-models-cleared', {});
  }
  
  /**
   * Sample a model at a specific world position (for SDF models)
   * @param modelId ID of the model to sample
   * @param position World position
   * @returns SDF value at the position, or null if not an SDF model or position out of bounds
   */
  public sampleModelAt(modelId: string, position: Vec3): number | null {
    const model = this.models.get(modelId);
    if (!model || model.modelType !== VoxelModelType.SDF) {
      return null;
    }
    
    if (typeof model.sampleAt !== 'function') {
      return null;
    }
    
    return model.sampleAt(position[0], position[1], position[2]);
  }
  
  /**
   * Create a debug visualization of a voxel model
   * This just logs information about the model for now
   * @param modelId ID of the model to debug
   */
  public debugModel(modelId: string): void {
    const model = this.models.get(modelId);
    if (!model) {
      console.warn(`Model not found: ${modelId}`);
      return;
    }
    
    console.group(`Debug info for model: ${model.name} (${modelId})`);
    console.log('Model type:', model.modelType);
    console.log('Source format:', model.sourceFormat);
    console.log('Storage method:', model.storageMethod);
    console.log('Dimensions:', model.dimensions);
    console.log('Resolution:', model.resolution);
    console.log('Origin:', model.origin);
    console.log('World bounds:', model.worldBounds);
    console.log('Voxel count:', model.getVoxelCount());
    console.log('Materials:', model.materials.length);
    console.log('Created:', model.createdAt);
    console.log('Last updated:', model.updatedAt);
    console.groupEnd();
  }
}