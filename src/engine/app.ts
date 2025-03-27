import { UIManager } from "./ui/uiManager";
import { Renderer } from "./render/renderer";
import { EventSystem } from "./events/eventSystem";
import { RenderContext } from "./render/renderContext";

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
        this.uiManager = new UIManager(undefined, this.renderContext);
        
        (window as any).app = this;
        
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
        
        // Update simulation with delta time
        this.renderer.render(deltaTime);
        this.uiManager.updateUI();
            
        requestAnimationFrame(this.run);
    }
}