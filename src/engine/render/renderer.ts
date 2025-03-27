import { PipelineManager } from "./pipelineDescriptors/pipelineManager";
import { BufferManager } from "./buffers/bufferManager";

// Remdering
import { RenderContext } from "./renderContext";

export class Renderer {
    canvas: HTMLCanvasElement;

    adapter!: GPUAdapter;
    device!: GPUDevice;
    context!: GPUCanvasContext;
    format!: GPUTextureFormat;

    bufferManager!: BufferManager;
    pipelineManager!: PipelineManager;

    initialized: boolean = false;
    texturesLoaded: boolean = false;

    constructor(canvas: HTMLCanvasElement, private renderContext?: RenderContext) {
        this.canvas = canvas;
        this.renderContext = renderContext;
    }

    async Initialize() {
        await this.setupDevice();
        this.bufferManager = new BufferManager(this.device, this.canvas);
        this.pipelineManager = new PipelineManager(this.device, this.bufferManager);
        
        this.initialized = true;
    }

    async setupDevice() {
        try {
            const adapter = await navigator.gpu?.requestAdapter();
            if (!adapter) {
                throw new Error("Failed to get GPU adapter.");
            }
            this.adapter = adapter;

            const device = await this.adapter.requestDevice();
            if (!device) {
                throw new Error("Failed to get GPU device.");
            }
            this.device = device;

            this.device.lost.then((info) => {
                console.error("WebGPU device was lost:", info);
                // Attempt to recreate the device
                this.setupDevice();
            });
            
            const context = this.canvas.getContext("webgpu");
            if (!context) {
                throw new Error("Failed to get WebGPU context.");
            }
            this.context = context;
            console.log("WebGPU context obtained:", this.context);
            console.log("Configuring context...");

            this.format = "bgra8unorm";
            this.context.configure({
                device: this.device,
                format: this.format,
                alphaMode: "opaque"
            });

            // Add cleanup on unload
            const cleanup = () => {
                console.log("Cleaning up WebGPU resources...");
                if (this.device) {
                    this.device.destroy();
                }
            };
            window.addEventListener('unload', cleanup);
            window.addEventListener('beforeunload', cleanup);

        } catch (error) {
            console.error("Error during WebGPU setup:", error);
        }
    }
    

    render(deltaTime: number) {
        if (!this.initialized) {
            console.warn("Renderer not initialized yet");
            return;
        }
        
        // Update all settings
        this.renderContext?.update(deltaTime);
        
        // Render based on the current mode
        this.renderDefault()
    }

    renderDefault() {
        const commandEncoder = this.device.createCommandEncoder();
        
        const ray_trace_pass = commandEncoder.beginComputePass();
        ray_trace_pass.setPipeline(this.pipelineManager.computePipeline.computePipeline);
        ray_trace_pass.setBindGroup(0, this.pipelineManager.computePipeline.computeBindGroup);
        ray_trace_pass.dispatchWorkgroups(
            this.canvas.width * 4,
            this.canvas.height * 4, 1
        );
        ray_trace_pass.end();
        
        this.renderToScreen(commandEncoder, this.pipelineManager.screenPipeline.screenBindGroup);
    }

    private renderToScreen(commandEncoder: GPUCommandEncoder, bindGroup: GPUBindGroup) {
        const textureView = this.context.getCurrentTexture().createView();
        const renderpass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: {r: 0.0, g: 0.0, b: 0.0, a: 1.0},
                loadOp: "clear",
                storeOp: "store"
            }]
        });
        
        renderpass.setPipeline(this.pipelineManager.screenPipeline.screenPipeline);
        renderpass.setBindGroup(0, bindGroup);
        renderpass.draw(6, 1, 0, 0);
        renderpass.end();
        
        this.device.queue.submit([commandEncoder.finish()]);
    }
}