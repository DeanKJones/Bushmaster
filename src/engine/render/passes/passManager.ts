import { BufferManager } from "../buffers/bufferManager";
import { PipelineManager } from "../pipelineDescriptors/pipelineManager";
import { RenderPass } from "./renderPass";

export class RenderPassManager {
    device: GPUDevice;
    bufferManager: BufferManager;
    pipelineManager: PipelineManager;
    context: GPUCanvasContext;
    
    // The ordered list of render passes
    renderPasses: RenderPass[] = [];
    
    constructor(
        device: GPUDevice, 
        bufferManager: BufferManager, 
        pipelineManager: PipelineManager,
        context: GPUCanvasContext
    ) {
        this.device = device;
        this.bufferManager = bufferManager;
        this.pipelineManager = pipelineManager;
        this.context = context;
    }
    
    // Add a render pass to the compositor
    addRenderPass(pass: RenderPass): void {
        this.renderPasses.push(pass);
    }
    
    // Execute all enabled render passes in order
    render(): void {
        const commandEncoder = this.device.createCommandEncoder(
            { label: "Render Pass Command Encoder" }
        );
        
        // Execute each enabled render pass
        for (const pass of this.renderPasses) {
            if (pass.enabled) {
                pass.execute(commandEncoder);
            }
        }
        
        // Submit all the commands
        this.device.queue.submit([commandEncoder.finish()]);
    }
    
    // Get a render pass by name
    getRenderPass(name: string): RenderPass | undefined {
        return this.renderPasses.find(pass => pass.name === name);
    }
    
    // Enable or disable a render pass by name
    setRenderPassEnabled(name: string, enabled: boolean): void {
        const pass = this.getRenderPass(name);
        if (pass) {
            pass.setEnabled(enabled);
        }
    }
}