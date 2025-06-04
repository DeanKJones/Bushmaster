import { BaseRenderPass } from "../renderPass";
import { PipelineManager } from "../../pipelineDescriptors/pipelineManager";

export class GridRenderPass extends BaseRenderPass {
    device: GPUDevice;
    pipelineManager: PipelineManager;
    context: GPUCanvasContext;
    depthTexture!: GPUTexture;
    depthTextureView!: GPUTextureView;
    
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
        this.createDepthTexture();
    }
    
    createDepthTexture(): void {
        // Get canvas size
        const canvas = this.context.canvas as HTMLCanvasElement;
        
        // Create depth texture
        this.depthTexture = this.device.createTexture({
            size: {
                width: canvas.width,
                height: canvas.height
            },
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        });
        
        // Create view
        this.depthTextureView = this.depthTexture.createView();
    }

    execute(commandEncoder: GPUCommandEncoder): void {
        // Update grid camera buffer
        this.pipelineManager.gridPipeline.updateCameraBuffer();
        
        // Begin render pass
        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [
                {
                    view: this.context.getCurrentTexture().createView(),
                    loadOp: 'load',  // Important: Use 'load' to preserve previous content
                    storeOp: 'store'
                }
            ],
            depthStencilAttachment: {
                view: this.depthTextureView,
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store'
            }
        };
        
        const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor);
        renderPass.setPipeline(this.pipelineManager.gridPipeline.gridPipeline);
        renderPass.setBindGroup(0, this.pipelineManager.gridPipeline.gridBindGroup);
        renderPass.draw(4, 1, 0, 0);  // Draw a quad (4 vertices)
        renderPass.end();
    }
}