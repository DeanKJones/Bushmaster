import { PipelineManager } from "./pipelineDescriptors/pipelineManager";
import { BufferManager } from "./buffers/bufferManager";
import { RenderContext } from "./renderContext";
import { VoxelScene } from "../scene/voxelScene";
import { VoxelBufferManager } from "./buffers/voxel/voxelBufferManager";
import { renderToScreen } from "./passes/screen";

export class Renderer {
    canvas: HTMLCanvasElement;
    
    adapter!: GPUAdapter;
    device!: GPUDevice;
    context!: GPUCanvasContext;
    format!: GPUTextureFormat;

    bufferManager!: BufferManager;
    pipelineManager!: PipelineManager;
    
    // Voxel rendering related properties
    voxelScene: VoxelScene | null = null;
    voxelBufferManager: VoxelBufferManager | null = null;
    
    // Render mode selection
    private renderMode: 'default' | 'voxel' = 'default';

    // Camera parameters
    private camera = {
        position: [0, 3, -5] as [number, number, number],
        target: [0, 0, 0] as [number, number, number],
        up: [0, 1, 0] as [number, number, number],
        fov: 60 * Math.PI / 180,
        near: 0.1,
        far: 100.0
    };

    initialized: boolean = false;

    constructor(canvas: HTMLCanvasElement, private renderContext?: RenderContext) {
        this.canvas = canvas;
        this.renderContext = renderContext;
    }

    async Initialize() {
        await this.setupDevice();
        this.bufferManager = new BufferManager(this.device, this.canvas);
        
        // Initialize without voxel scene first
        this.pipelineManager = new PipelineManager(this.device, this.bufferManager);
        
        // Initialize voxel scene
        await this.initializeVoxelScene();
        
        this.initialized = true;
    }
    
    /**
     * Initialize the voxel scene and related resources
     */
    private async initializeVoxelScene() {
        // Create the voxel scene
        this.voxelScene = new VoxelScene();
        this.voxelScene.createDemoScene();
        
        // Initialize voxel buffer manager
        this.voxelBufferManager = new VoxelBufferManager(this.device, this.voxelScene);
        this.voxelBufferManager.initialize();
        
        // Now update the pipeline manager with voxel pipeline
        this.pipelineManager.updateVoxelPipeline(this.bufferManager, this.voxelBufferManager);
    }

    render(deltaTime: number) {
        if (!this.initialized) {
            console.warn("Renderer not initialized yet");
            return;
        }
        
        // Update render context
        this.renderContext?.update(deltaTime);
        
        // Update camera for voxel rendering
        if (this.voxelBufferManager && this.pipelineManager.voxelPipeline) {
            this.pipelineManager.voxelPipeline.updateCamera(
                this.camera.position,
                this.camera.target
            );
        }
        
        // Choose rendering method
        if (this.renderMode === 'voxel' && this.voxelBufferManager) {
            this.renderVoxels();
        } else {
            this.renderDefault();
        }
    }
    
    renderDefault() {
        // Existing gradient rendering method (using computePipeline for backup)
        const commandEncoder = this.device.createCommandEncoder();
        
        const ray_trace_pass = commandEncoder.beginComputePass();
        ray_trace_pass.setPipeline(this.pipelineManager.computePipeline.computePipeline);
        ray_trace_pass.setBindGroup(0, this.pipelineManager.computePipeline.computeBindGroup);
        ray_trace_pass.dispatchWorkgroups(
            this.canvas.width * 4,
            this.canvas.height * 4, 1
        );
        ray_trace_pass.end();
        
        renderToScreen(commandEncoder, 
                       this.pipelineManager.screenPipeline.screenBindGroup,
                       this.device,
                       this.context,
                       this.pipelineManager);
    }
    
    /**
     * Render the scene using voxel raytracing
     */
    renderVoxels() {
        if (!this.voxelBufferManager || !this.pipelineManager.voxelPipeline) {
            console.warn("Voxel rendering not initialized");
            return;
        }
        
        const commandEncoder = this.device.createCommandEncoder();
        
        // Run the voxel raytracer compute shader
        const ray_trace_pass = commandEncoder.beginComputePass();
        ray_trace_pass.setPipeline(this.pipelineManager.voxelPipeline.voxelComputePipeline);
        ray_trace_pass.setBindGroup(0, this.pipelineManager.voxelPipeline.voxelBindGroup);
        
        // Calculate dispatch size based on 8x8 workgroups
        const workgroupSizeX = Math.ceil(this.canvas.width * 4 / 8);
        const workgroupSizeY = Math.ceil(this.canvas.height * 4 / 8);
        ray_trace_pass.dispatchWorkgroups(workgroupSizeX, workgroupSizeY, 1);
        ray_trace_pass.end();
        
        // Render to screen
        renderToScreen(commandEncoder, 
                       this.pipelineManager.screenPipeline.screenBindGroup,
                       this.device,
                       this.context,
                       this.pipelineManager);
    }
    
    // Toggle method returns the current rendering mode
    public toggleRenderer(): string {
        this.renderMode = this.renderMode === 'default' ? 'voxel' : 'default';
        return this.renderMode;
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

    getCamera() {
        return this.camera;
    }
    
    /**
     * Updates the camera position
     */
    updateCamera(position: [number, number, number], target: [number, number, number], up: [number, number, number] = [0, 1, 0]) {
        this.camera.position = position;
        this.camera.target = target;
        this.camera.up = up;
    }
}
