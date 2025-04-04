import { VoxelScene } from '../scene/voxelScene';
import { VoxelBufferManager } from '../render/buffers/voxel/voxelBufferManager';
import { Renderer } from '../render/renderer';

/**
 * Main interface for voxel engine operations.
 * Provides simplified access to the voxel scene and rendering functionality.
 */
export class VoxelEngine {
    scene: VoxelScene;
    bufferManager: VoxelBufferManager | null = null;
    
    /**
     * Creates a new voxel engine instance
     */
    constructor(private renderer: Renderer) {
        // Create the scene
        this.scene = new VoxelScene();
    }
    
    /**
     * Initialize the voxel engine with a demo scene
     */
    async initialize(): Promise<void> {
        // Create a demo scene
        this.scene.createDemoScene();
        
        // Wait for the renderer to be initialized
        if (!this.renderer.device) {
            throw new Error("Renderer must be initialized before voxel engine");
        }
        
        // Create the buffer manager
        this.bufferManager = new VoxelBufferManager(this.renderer.device, this.scene);
        this.bufferManager.initialize();
        
        console.log("Voxel engine initialized successfully");
        return Promise.resolve();
    }
    
    /**
     * Update any dynamic voxel content (for animations, etc.)
     */
    update(deltaTime: number): void {
        // In the future, this could update voxel animations, physics, etc.
        deltaTime = deltaTime || 0;
        // If buffers need updating, do it here
        // if (needsBufferUpdate && this.bufferManager) {
        //     this.bufferManager.updateBuffers();
        // }
    }
    
    /**
     * Create a custom voxel scene
     */
    createCustomScene(): void {
        // For now, use the default demo scene
        this.scene.createDemoScene();
        
        // Rebuild the buffers if needed
        if (this.bufferManager) {
            this.bufferManager.updateBuffers();
        }
    }
    
    /**
     * Get the buffer manager for use by the renderer
     */
    getBufferManager(): VoxelBufferManager | null {
        return this.bufferManager;
    }
}