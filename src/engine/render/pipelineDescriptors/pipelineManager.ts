import { BufferManager } from "../buffers/bufferManager";
import { screenPipelineDescriptor } from "./screenPipelineDescription";
import { computePipelineDescriptor } from "./computePipelineDescription";

export class PipelineManager {

    device: GPUDevice;
    
    screenPipeline!: screenPipelineDescriptor;
    computePipeline!: computePipelineDescriptor;

    constructor(device: GPUDevice, bufferManager: BufferManager){
        this.device = device;

        this.screenPipeline = new screenPipelineDescriptor(this.device, bufferManager);
        this.computePipeline = new computePipelineDescriptor(this.device, bufferManager);
    }
}