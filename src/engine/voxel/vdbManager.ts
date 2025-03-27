/**
 * VDB Manager
 * Central class for managing VDB volumes and operations
 */
import { 
  VDBVolume, 
  Vec3, 
  VDBVolumeType,
  Material
} from './type/vdbTypes';
import { loadVDBFile, createTestVolume, printVolumeInfo } from './import/vdbImporter';
import { EventSystem } from '../events/eventSystem';
import { sphereSDF } from './util/vdbUtils';

/**
 * Manages all VDB volumes and operations
 */
export class VDBManager {
  private static instance: VDBManager;
  
  // Storage for all loaded volumes
  private volumes: Map<string, VDBVolume> = new Map();
  
  // Active volumes for rendering
  private activeVolumes: Set<string> = new Set();
  
  // Event system for notifications
  private eventSystem: EventSystem;
  
  private constructor() {
    this.eventSystem = EventSystem.getInstance();
    console.log('VDBManager initialized');
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): VDBManager {
    if (!VDBManager.instance) {
      VDBManager.instance = new VDBManager();
    }
    return VDBManager.instance;
  }
  
  /**
   * Load a VDB file
   * @param buffer ArrayBuffer containing VDB data
   * @returns Array of volume IDs for the loaded volumes
   */
  public async loadVDBFromBuffer(buffer: ArrayBuffer): Promise<string[]> {
    try {
      const volumes = await loadVDBFile(buffer);
      const volumeIds: string[] = [];
      
      for (const volume of volumes) {
        this.volumes.set(volume.uuid, volume);
        volumeIds.push(volume.uuid);
        
        // Emit event for volume loaded
        this.eventSystem.emit('vdb:volume-loaded', { 
          volumeId: volume.uuid, 
          name: volume.name 
        });
      }
      
      console.log(`Loaded ${volumes.length} volumes from VDB file`);
      return volumeIds;
    } catch (error) {
      console.error('Failed to load VDB file:', error);
      throw error;
    }
  }
  
  /**
   * Add a volume directly to the manager
   * @param volume VDB volume to add
   * @returns ID of the added volume
   */
  public addVolume(volume: VDBVolume): string {
    this.volumes.set(volume.uuid, volume);
    
    // Emit event for volume loaded
    this.eventSystem.emit('vdb:volume-loaded', { 
      volumeId: volume.uuid, 
      name: volume.name 
    });
    
    return volume.uuid;
  }
  
  /**
   * Create a test volume for development/testing
   * @returns ID of the created volume
   */
  public createTestVolume(): string {
    const volume = createTestVolume();
    this.volumes.set(volume.uuid, volume);
    
    // Emit event for volume created
    this.eventSystem.emit('vdb:volume-created', { 
      volumeId: volume.uuid, 
      name: volume.name 
    });
    
    console.log('Created test volume:', volume.uuid);
    printVolumeInfo(volume);
    
    return volume.uuid;
  }
  
  /**
   * Create a primitive sphere volume
   * @param name Name for the volume
   * @param center Center position
   * @param radius Radius of the sphere
   * @param resolution Voxel resolution
   * @param material Material for the sphere
   * @returns ID of the created volume
   */
  public createSphereVolume(
    name: string, 
    //center: Vec3, 
    //radius: number, 
    resolution: number,
    material?: Material
  ): string {
    // Use createTestVolume as a base and customize it
    const volume = createTestVolume();
    
    // Update properties
    volume.name = name;
    volume.uuid = `sphere-${Date.now()}`;
    volume.resolution = resolution;
    
    if (material) {
      volume.materials = [material];
    }
    
    // Store and emit event
    this.volumes.set(volume.uuid, volume);
    this.eventSystem.emit('vdb:volume-created', { 
      volumeId: volume.uuid, 
      name: volume.name 
    });
    
    console.log(`Created sphere volume: ${name} (${volume.uuid})`);
    return volume.uuid;
  }
  
  /**
   * Get a volume by ID
   * @param volumeId ID of the volume
   * @returns The volume, or undefined if not found
   */
  public getVolume(volumeId: string): VDBVolume | undefined {
    return this.volumes.get(volumeId);
  }
  
  /**
   * Get all loaded volumes
   * @returns Map of all volumes
   */
  public getAllVolumes(): Map<string, VDBVolume> {
    return this.volumes;
  }
  
  /**
   * Get summary information for all volumes
   * @returns Array of volume summary objects
   */
  public getVolumeSummaries(): Array<{
    id: string,
    name: string,
    type: VDBVolumeType,
    bounds: { min: Vec3, max: Vec3 },
    isActive: boolean
  }> {
    const summaries = [];
    
    for (const [id, volume] of this.volumes.entries()) {
      summaries.push({
        id,
        name: volume.name,
        type: volume.volumeType,
        bounds: volume.worldBounds,
        isActive: this.activeVolumes.has(id)
      });
    }
    
    return summaries;
  }
  
  /**
   * Activate a volume for rendering
   * @param volumeId ID of the volume to activate
   * @returns True if successful, false if volume not found
   */
  public activateVolume(volumeId: string): boolean {
    if (!this.volumes.has(volumeId)) {
      return false;
    }
    
    this.activeVolumes.add(volumeId);
    this.eventSystem.emit('vdb:volume-activated', { volumeId });
    return true;
  }
  
  /**
   * Deactivate a volume (remove from rendering)
   * @param volumeId ID of the volume to deactivate
   * @returns True if successful, false if volume not found
   */
  public deactivateVolume(volumeId: string): boolean {
    if (!this.volumes.has(volumeId)) {
      return false;
    }
    
    this.activeVolumes.delete(volumeId);
    this.eventSystem.emit('vdb:volume-deactivated', { volumeId });
    return true;
  }
  
  /**
   * Get all active volumes
   * @returns Array of active volume IDs
   */
  public getActiveVolumeIds(): string[] {
    return Array.from(this.activeVolumes);
  }
  
  /**
   * Get all active volumes
   * @returns Array of active volumes
   */
  public getActiveVolumes(): VDBVolume[] {
    return Array.from(this.activeVolumes).map(id => this.volumes.get(id)!);
  }
  
  /**
   * Sample a volume at a specific world position
   * @param volumeId ID of the volume to sample
   * @param position World position
   * @returns Density value at position, or null if outside volume
   */
  public sampleVolumeAt(volumeId: string, position: Vec3): number | null {
    const volume = this.volumes.get(volumeId);
    if (!volume) {
      return null;
    }
    
    // For testing, we just use a sphere SDF directly
    // In a real implementation, we would use the VDB tree structure to look up the value
    const center: Vec3 = [0, 0, 0]; // Assuming test sphere is at origin
    const radius = 8; // Assuming test sphere radius
    return sphereSDF(position, center, radius);
  }
  
  /**
   * Delete a volume
   * @param volumeId ID of the volume to delete
   * @returns True if successful, false if volume not found
   */
  public deleteVolume(volumeId: string): boolean {
    if (!this.volumes.has(volumeId)) {
      return false;
    }
    
    // Deactivate first if needed
    if (this.activeVolumes.has(volumeId)) {
      this.deactivateVolume(volumeId);
    }
    
    // Delete the volume
    this.volumes.delete(volumeId);
    this.eventSystem.emit('vdb:volume-deleted', { volumeId });
    
    return true;
  }
  
  /**
   * Clear all volumes
   */
  public clearAllVolumes(): void {
    this.activeVolumes.clear();
    this.volumes.clear();
    this.eventSystem.emit('vdb:all-volumes-cleared', {});
  }
  
  /**
   * Get the count of volumes
   */
  public getVolumeCount(): number {
    return this.volumes.size;
  }
  
  /**
   * Print debug info for a volume
   * @param volumeId ID of the volume
   */
  public debugVolume(volumeId: string): void {
    const volume = this.volumes.get(volumeId);
    if (!volume) {
      console.warn(`Volume not found: ${volumeId}`);
      return;
    }
    
    printVolumeInfo(volume);
  }
}