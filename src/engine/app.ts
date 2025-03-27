import { UIManager } from "./ui/uiManager";
import { Renderer } from "./render/renderer";
import { EventSystem } from "./events/eventSystem";
import { RenderContext } from "./render/renderContext";

// Import the unified voxel system
import { initializeVoxelSystem, createVoxelTestUI } from "./voxel/integration/voxelIntegration";
import { VoxelManager } from "./voxel/voxelManager";

export class App {
    private canvases: Map<string, HTMLCanvasElement>;

    private uiManager: UIManager;

    private renderer: Renderer;
    private renderContext: RenderContext;

    // Unified voxel system
    private voxelManager: VoxelManager;

    private initialized: boolean = false;
    private lastTime: number = performance.now();
    private frameCount: number = 0;

    constructor(canvases: { [key: string]: HTMLCanvasElement }) {
        this.canvases = new Map(Object.entries(canvases));
        let mainViewport = this.canvases.get("viewportMain");
        
        // Initialize event system first (needed for settings manager and UI)
        EventSystem.getInstance();

        // Create render context
        this.renderContext = new RenderContext();
    
        // Initialize renderer
        this.renderer = new Renderer(mainViewport!, this.renderContext);
        this.uiManager = new UIManager(undefined, this.renderContext);

        // Initialize unified voxel system
        this.voxelManager = initializeVoxelSystem();
        
        // Create test UI
        createVoxelTestUI();
        
        // Expose key components for debugging in the console
        (window as any).app = this;
        (window as any).voxelManager = this.voxelManager; // Expose for console debugging
        
        // Start renderer initialization
        this.renderer.Initialize().then(() => {
            this.initialized = true;
            console.log("Renderer initialized successfully");
            
            this.run();
        }).catch(error => {
            console.error("Failed to initialize renderer:", error);
        });
    }

    /**
     * Main animation loop
     */
    public run = (): void => {
        // Check if initialized before rendering
        if (!this.initialized) {
            console.warn("Waiting for initialization...");
            requestAnimationFrame(this.run);
            return;
        }

        // Calculate delta time
        const now = performance.now();
        const deltaTime = (now - this.lastTime) * 0.001; // Convert to seconds
        this.lastTime = now;
        this.frameCount++;
        
        // Update render context with frame data
        this.renderContext.update(deltaTime);
        
        // Update active voxel models
        // This would be where we process voxel operations in a real implementation
        
        // Render the scene
        this.renderer.render(deltaTime);
        this.uiManager.updateUI();
            
        requestAnimationFrame(this.run);
    }
}