import { BaseRenderPass } from "../renderPass";
import { PipelineManager } from "../../pipelineDescriptors/pipelineManager";
import { BufferManager } from "../../buffers/bufferManager";

// Voxel raytrace rendering pass
export class VoxelRenderPass extends BaseRenderPass {
    device: GPUDevice;
    pipelineManager: PipelineManager;
    bufferManager: BufferManager;
    canvas: HTMLCanvasElement;
    
    constructor(
        name: string,
        device: GPUDevice,
        pipelineManager: PipelineManager,
        bufferManager: BufferManager,
        canvas: HTMLCanvasElement
    ) {
        super(name);
        this.device = device;
        this.pipelineManager = pipelineManager;
        this.bufferManager = bufferManager;
        this.canvas = canvas;
    }
    
    execute(commandEncoder: GPUCommandEncoder): void {
        if (!this.pipelineManager.voxelPipeline) {
            console.warn("Voxel pipeline not initialized");
            return;
        }
        
        const ray_trace_pass = commandEncoder.beginComputePass();
        ray_trace_pass.setPipeline(this.pipelineManager.voxelPipeline.voxelComputePipeline);
        ray_trace_pass.setBindGroup(0, this.pipelineManager.voxelPipeline.voxelBindGroup);
        
        // Calculate dispatch size based on 8x8 workgroups
        const workgroupSizeX = Math.ceil(this.canvas.width * 4 / 8);
        const workgroupSizeY = Math.ceil(this.canvas.height * 4 / 8);
        ray_trace_pass.dispatchWorkgroups(workgroupSizeX, workgroupSizeY, 1);
        ray_trace_pass.end();
    }
}