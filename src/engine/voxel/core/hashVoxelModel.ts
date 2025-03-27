import { BaseVoxelModel } from './baseVoxelModel';
import {
  VoxelData,
  VoxelModelType,
  VoxelSourceFormat,
  VoxelStorageMethod,
  Material,
  Vec3,
  Matrix4x4
} from './types';

/**
 * Voxel model implementation using a hash map for storage
 * Efficient for sparse voxel data
 */
export class HashVoxelModel extends BaseVoxelModel {
  // Hash map for voxel data storage: key = "x,y,z", value = voxel data
  private voxels: Map<string, VoxelData> = new Map();
  
  constructor(options: {
    name: string;
    modelType: VoxelModelType;
    sourceFormat: VoxelSourceFormat;
    dimensions?: Vec3;
    origin?: Vec3;
    resolution?: number;
    materials?: Material[];
    transform?: Matrix4x4;
  }) {
    super({
      ...options,
      storageMethod: VoxelStorageMethod.HASH_TABLE
    });
  }
  
  /**
   * Create a hash key from grid coordinates
   */
  private createKey(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
  }
  
  /**
   * Parse a hash key into grid coordinates
   */
  private parseKey(key: string): Vec3 {
    const [x, y, z] = key.split(',').map(Number);
    return [x, y, z];
  }
  
  /**
   * Get voxel data at the specified grid coordinates
   */
  public getVoxelAt(x: number, y: number, z: number): VoxelData | null {
    const key = this.createKey(x, y, z);
    return this.voxels.get(key) || null;
  }
  
  /**
   * Set voxel data at the specified grid coordinates
   */
  public setVoxelAt(x: number, y: number, z: number, data: VoxelData): void {
    const key = this.createKey(x, y, z);
    this.voxels.set(key, data);
    this.markUpdated();
    
    // Update bounds if necessary
    this.updateBoundsForVoxel(x, y, z);
  }
  
  /**
   * Get the total number of voxels in this model
   */
  public getVoxelCount(): number {
    return this.voxels.size;
  }
  
  /**
   * Sample the SDF value at a world position (for SDF models)
   */
  public sampleAt(worldX: number, worldY: number, worldZ: number): number {
    // Convert to grid coordinates
    const [gridX, gridY, gridZ] = this.worldToGrid(worldX, worldY, worldZ);
    
    // Get voxel at this position
    const voxel = this.getVoxelAt(gridX, gridY, gridZ);
    
    // If this is an SDF model and we have density data, return it
    if (this.modelType === VoxelModelType.SDF && voxel?.density !== undefined) {
      return voxel.density;
    }
    
    // For non-SDF models or empty voxels, return a large positive value
    // indicating "outside" the model
    return 1000.0;
  }
  
  /**
   * Update the world bounds to include the specified voxel
   */
  private updateBoundsForVoxel(x: number, y: number, z: number): void {
    // Convert to world space
    const [worldX, worldY, worldZ] = this.gridToWorld(x, y, z);
    
    // Update min bounds
    this.worldBounds.min[0] = Math.min(this.worldBounds.min[0], worldX);
    this.worldBounds.min[1] = Math.min(this.worldBounds.min[1], worldY);
    this.worldBounds.min[2] = Math.min(this.worldBounds.min[2], worldZ);
    
    // Update max bounds (add voxel size to get the far edge)
    this.worldBounds.max[0] = Math.max(this.worldBounds.max[0], worldX + this.resolution);
    this.worldBounds.max[1] = Math.max(this.worldBounds.max[1], worldY + this.resolution);
    this.worldBounds.max[2] = Math.max(this.worldBounds.max[2], worldZ + this.resolution);
  }
  
  /**
   * Get all voxel positions as an array
   */
  public getVoxelPositions(): Vec3[] {
    return Array.from(this.voxels.keys()).map(key => this.parseKey(key));
  }
  
  /**
   * Clear all voxels
   */
  public clear(): void {
    this.voxels.clear();
    this.markUpdated();
    this.worldBounds = this.calculateInitialWorldBounds();
  }
  
  /**
   * Set multiple voxels at once
   */
  public setVoxels(voxelData: { position: Vec3, data: VoxelData }[]): void {
    for (const { position, data } of voxelData) {
      this.setVoxelAt(position[0], position[1], position[2], data);
    }
  }
  
  /**
   * Convert to JSON for serialization
   */
  public toJSON(): any {
    const voxelEntries = Array.from(this.voxels.entries()).map(
      ([key, data]) => [key, data]
    );
    
    return {
      id: this.id,
      name: this.name,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      sourceFormat: this.sourceFormat,
      modelType: this.modelType,
      storageMethod: this.storageMethod,
      resolution: this.resolution,
      origin: this.origin,
      dimensions: this.dimensions,
      worldBounds: this.worldBounds,
      transform: this.transform,
      materials: this.materials,
      voxels: voxelEntries
    };
  }
  
  /**
   * Create a HashVoxelModel from JSON
   */
  public static fromJSON(json: any): HashVoxelModel {
    const model = new HashVoxelModel({
      name: json.name,
      modelType: json.modelType,
      sourceFormat: json.sourceFormat,
      dimensions: json.dimensions,
      origin: json.origin,
      resolution: json.resolution,
      materials: json.materials,
      transform: json.transform
    });
    
    // Restore ID and dates
    model.id = json.id;
    model.createdAt = new Date(json.createdAt);
    model.updatedAt = new Date(json.updatedAt);
    
    // Restore voxel data
    const voxelEntries = json.voxels as [string, VoxelData][];
    for (const [key, data] of voxelEntries) {
      model.voxels.set(key, data);
    }
    
    // Restore bounds
    model.worldBounds = json.worldBounds;
    
    return model;
  }
}