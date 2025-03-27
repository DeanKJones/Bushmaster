import { RenderContext } from "../../render/renderContext";

export class RenderContextUI {
    private context: RenderContext;
    private container: HTMLDivElement;
    private isExpanded: boolean = true;
    
    constructor(context: RenderContext) {
        this.context = context;
        this.container = this.createContainer();
        document.body.appendChild(this.container);
        
        // Initial render
        this.update();
    }
    
    /**
     * Create the container for the render context display
     */
    private createContainer(): HTMLDivElement {
        const container = document.createElement('div');
        container.className = 'render-context';
        container.style.position = 'fixed';
        container.style.top = '25px';
        container.style.left = '10px';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        container.style.color = 'white';
        container.style.padding = '5px';
        container.style.borderRadius = '5px';
        container.style.zIndex = '1000';
        container.style.fontFamily = 'monospace';
        container.style.fontSize = '14px';
        container.style.userSelect = 'none';
        container.style.pointerEvents = 'auto';
        
        container.innerHTML = `
            <div class="render-context-header" style="cursor: pointer; padding: 5px;">
                Render Context <span id="context-toggle">[−]</span>
            </div>
            <div class="render-context-content" style="padding: 5px;">
                <div class="render-stat">
                    <span class="stat-name">FPS:</span>
                    <span class="stat-value" id="fps-value">0</span>
                </div>
                <div class="render-stat">
                    <span class="stat-name">Frame:</span>
                    <span class="stat-value" id="frame-value">0</span>
                </div>
                <div class="render-stat">
                    <span class="stat-name">Delta:</span>
                    <span class="stat-value" id="delta-value">0.0 ms</span>
                </div>
            </div>
        `;
        
        // Add toggle functionality
        const header = container.querySelector('.render-context-header') as HTMLDivElement;
        const toggleSpan = container.querySelector('#context-toggle') as HTMLSpanElement;
        const content = container.querySelector('.render-context-content') as HTMLDivElement;
        
        header.addEventListener('click', () => {
            this.isExpanded = !this.isExpanded;
            if (this.isExpanded) {
                content.style.display = 'block';
                toggleSpan.textContent = '[−]';
            } else {
                content.style.display = 'none';
                toggleSpan.textContent = '[+]';
            }
        });
        
        return container;
    }
    
    /**
     * Update the UI with current render context values
     */
    public update(): void {
        // Update standard metrics
        this.updateElement('fps-value', `${this.context.getFps().toFixed(1)}`);
        this.updateElement('frame-value', `${this.context.getFrameCount()}`);
        this.updateElement('delta-value', `${(this.context.getDeltaTime() * 1000).toFixed(2)} ms`);
    }
    
    /**
     * Update a specific element with a value
     */
    private updateElement(id: string, value: any): void {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value.toString();
        }
    }
}