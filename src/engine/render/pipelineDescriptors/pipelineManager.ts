import { BufferManager } from "../buffers/bufferManager";
import { screenPipelineDescriptor } from "./screenPipelineDescription";
import { computePipelineDescriptor } from "./computePipelineDescription";
import { VoxelComputePipelineDescriptor } from "./raytracePipelineDescription";
import { VoxelBufferManager } from "../buffers/voxel/voxelBufferManager";

export class PipelineManager {
    device: GPUDevice;
    
    screenPipeline!: screenPipelineDescriptor;
    computePipeline!: computePipelineDescriptor;
    voxelPipeline!: VoxelComputePipelineDescriptor;

    constructor(device: GPUDevice, bufferManager: BufferManager, voxelBufferManager?: VoxelBufferManager) {
        this.device = device;

        this.screenPipeline = new screenPipelineDescriptor(this.device, bufferManager);
        this.computePipeline = new computePipelineDescriptor(this.device, bufferManager);
        
        // Initialize voxel pipeline if buffer manager is provided
        if (voxelBufferManager) {
            this.voxelPipeline = new VoxelComputePipelineDescriptor(
                this.device, 
                bufferManager, 
                voxelBufferManager
            );
        }
    }
    
    // Update voxel pipeline with new voxel buffer manager
    updateVoxelPipeline(bufferManager: BufferManager, voxelBufferManager: VoxelBufferManager): void {
        this.voxelPipeline = new VoxelComputePipelineDescriptor(
            this.device,
            bufferManager,
            voxelBufferManager
        );
    }
}