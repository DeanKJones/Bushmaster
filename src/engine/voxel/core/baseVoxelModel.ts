import {
    VoxelModel,
    VoxelData,
    Vec3,
    Matrix4x4,
    Material,
    BoundingBox,
    VoxelModelType,
    VoxelSourceFormat,
    VoxelStorageMethod,
    VOXEL_CONFIG
  } from './types';
  
  /**
   * Abstract base class for voxel models
   * Provides common functionality that all voxel model implementations share
   */
  export abstract class BaseVoxelModel implements VoxelModel {
    // Identification
    public id: string;
    public name: string;
    
    // Creation metadata
    public createdAt: Date;
    public updatedAt: Date;
    public sourceFormat: VoxelSourceFormat;
    
    // Type and storage info
    public modelType: VoxelModelType;
    public storageMethod: VoxelStorageMethod;
    
    // Spatial information
    public resolution: number;
    public origin: Vec3;
    public dimensions: Vec3;
    public worldBounds: BoundingBox;
    public transform: Matrix4x4;
    
    // Material information
    public materials: Material[];
    
    constructor(options: {
      name: string;
      modelType: VoxelModelType;
      storageMethod: VoxelStorageMethod;
      sourceFormat: VoxelSourceFormat;
      dimensions?: Vec3;
      origin?: Vec3;
      resolution?: number;
      materials?: Material[];
      transform?: Matrix4x4;
    }) {
      // Generate unique ID
      this.id = `voxel_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Set basic properties
      this.name = options.name;
      this.modelType = options.modelType;
      this.storageMethod = options.storageMethod;
      this.sourceFormat = options.sourceFormat;
      
      // Set dates
      this.createdAt = new Date();
      this.updatedAt = new Date();
      
      // Set spatial information
      this.dimensions = options.dimensions || [0, 0, 0];
      this.origin = options.origin || [0, 0, 0];
      this.resolution = options.resolution || VOXEL_CONFIG.DEFAULT_RESOLUTION;
      this.transform = options.transform || [...VOXEL_CONFIG.DEFAULT_TRANSFORM];
      
      // Initialize with empty materials if none provided
      this.materials = options.materials || [this.createDefaultMaterial()];
      
      // Initialize bounds (will be updated as voxels are added)
      this.worldBounds = this.calculateInitialWorldBounds();
    }
    
    /**
     * Convert from grid coordinates to world coordinates
     */
    protected gridToWorld(gridX: number, gridY: number, gridZ: number): Vec3 {
      return [
        this.origin[0] + gridX * this.resolution,
        this.origin[1] + gridY * this.resolution,
        this.origin[2] + gridZ * this.resolution
      ];
    }
    
    /**
     * Convert from world coordinates to grid coordinates
     */
    protected worldToGrid(worldX: number, worldY: number, worldZ: number): Vec3 {
      return [
        Math.floor((worldX - this.origin[0]) / this.resolution),
        Math.floor((worldY - this.origin[1]) / this.resolution),
        Math.floor((worldZ - this.origin[2]) / this.resolution)
      ];
    }
    
    /**
     * Create a default material
     */
    protected createDefaultMaterial(): Material {
      return {
        id: 0,
        albedo: [0.8, 0.8, 0.8],
        metallic: 0.0,
        roughness: 0.5,
        emission: [0, 0, 0]
      };
    }
    
    /**
     * Calculate the initial world bounds based on dimensions and origin
     */
    protected calculateInitialWorldBounds(): BoundingBox {
      const worldSize: Vec3 = [
        this.dimensions[0] * this.resolution,
        this.dimensions[1] * this.resolution,
        this.dimensions[2] * this.resolution
      ];
      
      return {
        min: [...this.origin],
        max: [
          this.origin[0] + worldSize[0],
          this.origin[1] + worldSize[1],
          this.origin[2] + worldSize[2]
        ]
      };
    }
    
    /**
     * Update the timestamp when the model is modified
     */
    protected markUpdated(): void {
      this.updatedAt = new Date();
    }
    
    /**
     * Get a summary of this voxel model
     */
    public getSummary(): any {
      return {
        id: this.id,
        name: this.name,
        type: this.modelType,
        format: this.sourceFormat,
        dimensions: this.dimensions,
        voxelCount: this.getVoxelCount(),
        bounds: this.worldBounds
      };
    }
    
    // Abstract methods that must be implemented by subclasses
    public abstract getVoxelAt(x: number, y: number, z: number): VoxelData | null;
    public abstract setVoxelAt(x: number, y: number, z: number, data: VoxelData): void;
    public abstract getVoxelCount(): number;
  }