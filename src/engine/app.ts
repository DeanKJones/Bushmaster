import { UIManager } from "./ui/uiManager";
import { Renderer } from "./render/renderer";
import { EventSystem } from "./events/eventSystem";
import { RenderContext } from "./render/renderContext";
import { CameraController } from "./events/cameraController";
import { VoxelEngine } from "./voxel/voxelEngine";

export class App {
    private canvases: Map<string, HTMLCanvasElement>;

    private uiManager: UIManager;
    private renderer: Renderer;
    private renderContext: RenderContext;
    
    // The voxel engine that manages our voxel scene
    private voxelEngine: VoxelEngine;

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
        this.uiManager = new UIManager(undefined, this.renderContext, this.renderer);
        
        // Create voxel engine instance
        this.voxelEngine = new VoxelEngine(this.renderer);
        
        // Expose key components for debugging in the console
        (window as any).app = this;
        (window as any).voxelEngine = this.voxelEngine;
        
        // Start renderer initialization
        this.renderer.Initialize().then(async () => {
            // Initialize the voxel engine
            await this.initializeVoxelEngine();
            
            this.initialized = true;
            console.log("Engine initialized successfully");
            
            // Initialize camera controller
            this.initializeCameraController();
            
            this.run();
        }).catch(error => {
            console.error("Failed to initialize renderer:", error);
        });
    }
    
    /**
     * Initialize the voxel engine and set up voxel rendering
     */
    private async initializeVoxelEngine() {
        try {
            await this.voxelEngine.initialize();
            console.log("Voxel engine initialized successfully");
        } catch (error) {
            console.error("Failed to initialize voxel engine:", error);
        }
    }
    
    private initializeCameraController() {
        // Add camera controller for SDF scene interaction
        const cameraController = new CameraController(this.renderer.getCamera());
        
        // Expose for debugging
        (window as any).cameraController = cameraController;
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
        
        // Update the voxel engine
        this.voxelEngine.update(deltaTime);
        
        // Render the scene
        this.renderer.render(deltaTime);
        this.uiManager.updateUI();
            
        requestAnimationFrame(this.run);
    }
}