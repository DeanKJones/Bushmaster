import { BufferManager } from "../../buffers/bufferManager";
import { VoxelBufferManager } from "../../../render/buffers/voxel/voxelBufferManager";
import voxelRaytracerCode from "../../../shaders/raytrace/raytraceMain.wgsl";
import { Camera } from "../../camera/camera";

export class VoxelComputePipelineDescriptor {
    device: GPUDevice;
    bufferManager: BufferManager;
    voxelBufferManager: VoxelBufferManager;

    voxelBindGroupLayout!: GPUBindGroupLayout;
    voxelBindGroup!: GPUBindGroup;
    voxelComputePipeline!: GPUComputePipeline;
    
    // Camera information
    cameraBuffer!: GPUBuffer;
    private camera: Camera;

    constructor(device: GPUDevice, bufferManager: BufferManager, voxelBufferManager: VoxelBufferManager) {
        this.device = device;
        this.bufferManager = bufferManager;
        this.voxelBufferManager = voxelBufferManager;
        
        // Get the camera instance
        this.camera = Camera.getInstance();
        
        this.initialize();
    }

    initialize = async () => {
        this.createCameraBuffer();
        this.createRaytraceBindGroupLayout();
        await this.createRaytraceBindGroup();
        await this.createRaytraceComputePipeline();
    }

    createCameraBuffer = () => {
        // Create a buffer for camera data
        const bufferSize = 
            3 * 4 + // position (3 floats)
            4 +     // padding
            3 * 4 + // target (3 floats)
            4 +     // padding
            3 * 4 + // up (3 floats)
            4 +     // padding
            4 +     // fov (1 float)
            4 +     // aspect (1 float)
            8;      // extra padding to make it 64 bytes total (multiple of 16)
        
        this.cameraBuffer = this.device.createBuffer({
            label: "Camera Uniform Buffer",
            size: bufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // Initial update
        this.updateCameraBuffer();
    }
    
    updateCameraBuffer = () => {
        // Update aspect ratio based on canvas
        const aspect = this.bufferManager.canvas.width / this.bufferManager.canvas.height;
        this.camera.setAspect(aspect);
        
        // Get the current camera data
        const position = this.camera.getPosition();
        const target = this.camera.getTarget();
        const up = this.camera.getUp();
        const fov = this.camera.getFov();
        
        // Create a typed array for the data
        const data = new Float32Array([
            ...position, 0, // Add padding
            ...target, 0,   // Add padding
            ...up, 0,       // Add padding
            fov,
            aspect,
            0, 0           // Extra padding to match buffer size
        ]);

        // Write to buffer
        this.device.queue.writeBuffer(this.cameraBuffer, 0, data);
    }
    
    /**
     * Update camera buffer from event data
     */
    updateCameraBufferFromEvent = (cameraData: any) => {
        // Update aspect ratio based on canvas
        const aspect = this.bufferManager.canvas.width / this.bufferManager.canvas.height;
        
        console.log('RaytracePipeline: Updating camera buffer from event', 
            cameraData.position, cameraData.target);
        
        // Create a typed array for the data
        const data = new Float32Array([
            ...cameraData.position, 0, // Add padding
            ...cameraData.target, 0,   // Add padding
            ...cameraData.up, 0,       // Add padding
            cameraData.fov,
            aspect,
            0, 0                      // Extra padding to match buffer size
        ]);

        // Write to buffer
        this.device.queue.writeBuffer(this.cameraBuffer, 0, data);
    }

    createRaytraceBindGroupLayout = () => {
        this.voxelBindGroupLayout = this.device.createBindGroupLayout({
            label: "Voxel Compute Bind Group Layout",
            entries: [
                // Camera data
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: "uniform" }
                },
                // Voxel data
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: "read-only-storage" }
                },
                // BLAS nodes
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: "read-only-storage" }
                },
                // TLAS nodes
                {
                    binding: 3,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: "read-only-storage" }
                },
                // BLAS instances
                {
                    binding: 4,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: "read-only-storage" }
                },
                // Materials
                {
                    binding: 5,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: "read-only-storage" }
                },
                // Output texture
                {
                    binding: 6,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: {
                        access: "write-only",
                        format: "rgba8unorm",
                        viewDimension: "2d"
                    }
                }
            ]
        });
    }

    createRaytraceBindGroup = async () => {
        const bindGroupLayout = this.voxelBindGroupLayout;
        
        this.voxelBindGroup = this.device.createBindGroup({
            label: "Voxel Compute Bind Group",
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: { buffer: this.cameraBuffer }
                },
                {
                    binding: 1,
                    resource: { buffer: this.voxelBufferManager.voxelBuffer }
                },
                {
                    binding: 2,
                    resource: { buffer: this.voxelBufferManager.blasNodeBuffer }
                },
                {
                    binding: 3,
                    resource: { buffer: this.voxelBufferManager.tlasNodeBuffer }
                },
                {
                    binding: 4,
                    resource: { buffer: this.voxelBufferManager.blasInstanceBuffer }
                },
                {
                    binding: 5,
                    resource: { buffer: this.voxelBufferManager.materialBuffer }
                },
                {
                    binding: 6,
                    resource: this.bufferManager.screenBuffers.colorBufferView
                }
            ]
        });
    }

    createRaytraceComputePipeline = async () => {
        const computeBindGroupLayout = this.voxelBindGroupLayout;
        const computePipeline_layout = this.device.createPipelineLayout({
            bindGroupLayouts: [computeBindGroupLayout]
        });

        this.voxelComputePipeline = 
            this.device.createComputePipeline({
                label: "Voxel Raytracer Pipeline",
                layout: computePipeline_layout,
                compute: {
                    module: this.device.createShaderModule({
                        code: voxelRaytracerCode,
                    }),
                    entryPoint: 'main',
                },
            });
    }
}