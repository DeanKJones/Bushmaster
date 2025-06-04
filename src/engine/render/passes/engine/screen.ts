import { BaseRenderPass } from "../renderPass";
import { PipelineManager } from "../../pipelineDescriptors/pipelineManager";

export class ScreenRenderPass extends BaseRenderPass {
    device: GPUDevice;
    pipelineManager: PipelineManager;
    context: GPUCanvasContext;
    
    constructor(
        name: string,
        device: GPUDevice,
        pipelineManager: PipelineManager,
        context: GPUCanvasContext
    ) {
        super(name);
        this.device = device;
        this.pipelineManager = pipelineManager;
        this.context = context;
    }
    
    execute(commandEncoder: GPUCommandEncoder): void {
        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [
                {
                    view: this.context.getCurrentTexture().createView(),
                    loadOp: 'load',  // Use 'load' to preserve any existing content 
                    storeOp: 'store'
                }
            ]
        };
        
        const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor);
        renderPass.setPipeline(this.pipelineManager.screenPipeline.screenPipeline);
        renderPass.setBindGroup(0, this.pipelineManager.screenPipeline.screenBindGroup);
        renderPass.draw(6, 1, 0, 0);
        renderPass.end();
    }
}