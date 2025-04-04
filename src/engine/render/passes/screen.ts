import { PipelineManager } from "../pipelineDescriptors/pipelineManager";

export function renderToScreen(commandEncoder: GPUCommandEncoder, 
                               bindGroup: GPUBindGroup, 
                               device: GPUDevice,
                               context: GPUCanvasContext,
                               pipelineManager: PipelineManager) {
    const renderPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: [
            {
                view: context.getCurrentTexture().createView(),
                loadOp: 'clear',
                storeOp: 'store',
                clearValue: { r: 0.05, g: 0.05, b: 0.05, a: 1.0 }
            }
        ]
    };
    
    const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor);
    renderPass.setPipeline(pipelineManager.screenPipeline.screenPipeline);
    renderPass.setBindGroup(0, bindGroup);
    renderPass.draw(6, 1, 0, 0);
    renderPass.end();
    
    device.queue.submit([commandEncoder.finish()]);
}