import { UIManager } from "./ui/uiManager";
import { Renderer } from "./render/renderer";
import { EventSystem } from "./events/eventSystem";
import { RenderContext } from "./render/renderContext";
import { CameraController } from "./events/cameraController";

export class App {
    private canvases: Map<string, HTMLCanvasElement>;

    private uiManager: UIManager;

    private renderer: Renderer;
    private renderContext: RenderContext;

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
        
        // Expose key components for debugging in the console
        (window as any).app = this;
        
        // Start renderer initialization
        this.renderer.Initialize().then(() => {
            this.initialized = true;
            console.log("Renderer initialized successfully");
            
            // Initialize camera controller
            this.initializeCameraController();
            
            this.run();
        }).catch(error => {
            console.error("Failed to initialize renderer:", error);
        });
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
        
        // Update active voxel models
        // This would be where we process voxel operations in a real implementation
        
        // Render the scene
        this.renderer.render(deltaTime);
        this.uiManager.updateUI();
            
        requestAnimationFrame(this.run);
    }
}