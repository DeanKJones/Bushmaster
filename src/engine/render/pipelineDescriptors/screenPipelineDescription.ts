import { BufferManager } from "../buffers/bufferManager";
import screenShader from "../../shaders/screen/screenShader.wgsl"


export class screenPipelineDescriptor {

    device: GPUDevice;
    bufferManager: BufferManager;

    screenBindGroup_layout!: GPUBindGroupLayout;
    screenPipeline!: GPURenderPipeline;
    screenBindGroup!: GPUBindGroup;

    constructor(device: GPUDevice, bufferManager: BufferManager) {
        this.device = device;
        this.bufferManager = bufferManager;
        this.initialize();
    }

    initialize = async () => {
        this.createScreenBindGroupLayout();
        await this.createScreenBindGroup();
        await this.createScreenPipeline();
    }

    
    createScreenBindGroupLayout = () => {
        this.screenBindGroup_layout = this.device.createBindGroupLayout({
            label: "Screen Bind Group Layout",
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {}
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {}
                },
            ]
        });
        return this.screenBindGroup_layout;
    }


    createScreenBindGroup = async () => {
        const bindGroupLayout = this.screenBindGroup_layout;

        this.screenBindGroup = this.device.createBindGroup({
            label: "Screen Bind Group",
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource:  this.bufferManager.screenBuffers.sampler
                },
                {
                    binding: 1,
                    resource: this.bufferManager.screenBuffers.colorBufferView
                }
            ]
        });
    }


    createScreenPipeline = async () => {
        const screenBindGroupLayout = this.screenBindGroup_layout;
        const screen_pipeline_layout = this.device.createPipelineLayout({
            bindGroupLayouts: [screenBindGroupLayout]
        });

        this.screenPipeline = this.device.createRenderPipeline({
            label: "Screen Pipeline",
            layout: screen_pipeline_layout,
            
            vertex: {
                module: this.device.createShaderModule({
                                    code: screenShader, 
                                }),
                entryPoint: 'vert_main',
            },

            fragment: {
                module: this.device.createShaderModule({
                                    code: screenShader,
                                }),
                entryPoint: 'frag_main',
                targets: [
                {
                    format: "bgra8unorm"
                }]
            },
            primitive: {
                topology: "triangle-list"
            }
        });
    }
}