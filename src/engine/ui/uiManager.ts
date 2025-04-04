import { Renderer } from '../render/renderer';
import { RenderContext } from "../render/renderContext";
import { RenderContextUI } from "./contexts/renderContextUI";

/**
 * Manages UI components and coordinates between different settings UIs
 */
export class UIManager {
    // Core systems
    private UICanvas: HTMLCanvasElement | undefined;

    // Render context UI
    private renderer: Renderer;
    private renderContext: RenderContext;
    private renderContextUI: RenderContextUI;

    constructor(
        canvas: HTMLCanvasElement | undefined,
        renderContext: RenderContext,
        renderer: Renderer
    ) {
        this.UICanvas = canvas;
        this.renderer = renderer;
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
        this.addRendererToggle();
        
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

    private addRendererToggle() {
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'renderer-toggle';
        toggleContainer.style.position = 'fixed';
        toggleContainer.style.bottom = '20px';
        toggleContainer.style.left = '20px';
        toggleContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        toggleContainer.style.padding = '10px';
        toggleContainer.style.borderRadius = '5px';
        toggleContainer.style.zIndex = '1000';
        
        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = 'Switch to Gradient Renderer';
        toggleBtn.addEventListener('click', () => {
            const usingBackup = this.renderer.toggleRenderer();
            toggleBtn.textContent = usingBackup 
                ? 'Switch to SDF Renderer' 
                : 'Switch to Gradient Renderer';
        });
        
        toggleContainer.appendChild(toggleBtn);
        document.body.appendChild(toggleContainer);
    }
}