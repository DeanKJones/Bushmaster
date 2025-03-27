
import { RenderContext } from "../render/renderContext";
import { RenderContextUI } from "./contexts/renderContextUI";

/**
 * Manages UI components and coordinates between different settings UIs
 */
export class UIManager {
    // Core systems
    private UICanvas: HTMLCanvasElement | undefined;

    // Render context UI
    private renderContext: RenderContext;
    private renderContextUI: RenderContextUI;

    constructor(
        canvas: HTMLCanvasElement | undefined,
        renderContext: RenderContext
    ) {
        this.UICanvas = canvas;
        
        // Rendering context
        this.renderContext = renderContext;
        this.renderContextUI = new RenderContextUI(this.renderContext);
        
        // Initialize UI
        this.initializeUI();
    }
    
    /**
     * Initialize all UI components
     */
    private initializeUI(): void {

        if (this.UICanvas) {
            this.UICanvas.width = 250;
            this.UICanvas.height = 220;
            this.UICanvas.style.border = '1px solid #333';
            this.UICanvas.style.marginLeft = '10px';
            this.UICanvas.style.marginBottom = '10px';
        }
        
        // Initial UI update
        this.updateUI();
    }
    
    
    /**
     * Update all UI elements based on current settings
     */
    public updateUI(): void {
        // Update render context UI
        this.renderContextUI.update();
    }
}