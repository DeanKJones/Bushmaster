import { VoxelScene } from '../scene/voxelScene';
import { VoxelBufferManager } from '../render/buffers/voxel/voxelBufferManager';
import { Renderer } from '../render/renderer';
import { Voxel } from './voxel';

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

    /**
     * Load a MagicaVoxel .vox model and add it to the scene
     */
    async loadVoxModel(id: string, url: string): Promise<void> {
        const { loadVox } = await import('./util/voxLoader');
        const voxData = await loadVox(url);
        const colorToMaterial = new Map<number, number>();
        const voxels = [] as import('./voxel').Voxel[];

        for (const v of voxData.voxels) {
            let matIdx = colorToMaterial.get(v.colorIndex);
            if (matIdx === undefined) {
                const color = voxData.palette[v.colorIndex - 1] || { r: 255, g: 255, b: 255, a: 255 };
                matIdx = this.scene.materials.length;
                this.scene.materials.push({
                    color: [color.r / 255, color.g / 255, color.b / 255],
                    roughness: 0.5,
                    metalness: 0.0,
                    emission: [0, 0, 0],
                    emissionStrength: 0
                });
                colorToMaterial.set(v.colorIndex, matIdx);
            }
            voxels.push(new Voxel([v.x, v.y, v.z], 1, matIdx, 0));
        }

        this.scene.createBLAS(id, voxels);
        this.scene.blasInstances.push({
            transform: [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
            transformInverse: [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
            blasOffset: this.scene.getBlasOffset(id),
            materialIdx: 0
        });
        this.scene.buildTLAS();
        this.bufferManager?.updateBuffers();
    }
}
