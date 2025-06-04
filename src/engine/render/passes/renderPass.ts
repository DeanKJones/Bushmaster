export interface RenderPass {
    enabled: boolean;
    name: string;
    execute(commandEncoder: GPUCommandEncoder): void;
    setEnabled(enabled: boolean): void;
}

// Base class for render passes
export abstract class BaseRenderPass implements RenderPass {
    enabled: boolean = true;
    name: string;
    
    constructor(name: string) {
        this.name = name;
    }
    
    abstract execute(commandEncoder: GPUCommandEncoder): void;
    
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }
}