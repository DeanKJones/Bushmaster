import { BufferManager } from "../../buffers/bufferManager";
import gridShader from "../../../shaders/editor/grid.wgsl";
import { Camera } from "../../camera/camera";

export class GridPipelineDescriptor {
    device: GPUDevice;
    bufferManager: BufferManager;
    
    // Grid pipeline resources
    gridBindGroupLayout!: GPUBindGroupLayout;
    gridPipeline!: GPURenderPipeline;
    gridBindGroup!: GPUBindGroup;
    
    // Camera buffer for grid rendering
    cameraBuffer!: GPUBuffer;
    private camera: Camera;
    
    constructor(device: GPUDevice, bufferManager: BufferManager) {
        this.device = device;
        this.bufferManager = bufferManager;
        
        // Get the camera instance
        this.camera = Camera.getInstance();
        
        this.initialize();
    }
    
    initialize = async () => {
        this.createCameraBuffer();
        this.createGridBindGroupLayout();
        await this.createGridBindGroup();
        await this.createGridPipeline();
    }
    
    createCameraBuffer = () => {
        // Create a buffer for camera data
        const bufferSize = 
            16 * 4 + // viewProj matrix (4x4 floats)
            16 * 4 + // invViewProj matrix (4x4 floats)
            3 * 4 +  // position (3 floats)
            4 +      // padding
            4 +      // nearPlane (1 float)
            4 +      // farPlane (1 float)
            2 * 4;   // padding (2 floats)
        
        this.cameraBuffer = this.device.createBuffer({
            label: "Grid Camera Uniform Buffer",
            size: bufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // Initial update
        this.updateCameraBuffer();
    }
    
    updateCameraBuffer = () => {
        // Get the current camera data
        const position = this.camera.getPosition();
        const viewProj = this.camera.getViewProjectionMatrix();
        const invViewProj = this.camera.getInverseViewProjectionMatrix();
        const nearPlane = this.camera.getNear();
        const farPlane = this.camera.getFar();
        
        // Create a typed array for the data
        const data = new Float32Array([
            // viewProj matrix (16 floats)
            ...viewProj,
            // invViewProj matrix (16 floats)
            ...invViewProj,
            // position (3 floats) + padding
            ...position, 0,
            // nearPlane, farPlane + padding
            nearPlane, farPlane, 0, 0
        ]);

        // Write to buffer
        this.device.queue.writeBuffer(this.cameraBuffer, 0, data);
    }
    
    updateCameraBufferFromEvent = (cameraData: any) => {
        const data = new Float32Array([
            // viewProj matrix (16 floats)
            ...cameraData.viewProjectionMatrix,
            // invViewProj matrix (16 floats)
            ...cameraData.inverseViewProjectionMatrix,
            // position (3 floats) + padding
            ...cameraData.position, 0,
            // nearPlane, farPlane + padding
            cameraData.near, cameraData.far, 0, 0
        ]);
    
        // Write to buffer
        this.device.queue.writeBuffer(this.cameraBuffer, 0, data);
    }
    
    createGridBindGroupLayout = () => {
        this.gridBindGroupLayout = this.device.createBindGroupLayout({
            label: "Grid Bind Group Layout",
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: { type: "uniform" }
                }
            ]
        });
    }
    
    createGridBindGroup = async () => {
        const bindGroupLayout = this.gridBindGroupLayout;
        
        this.gridBindGroup = this.device.createBindGroup({
            label: "Grid Bind Group",
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: { buffer: this.cameraBuffer }
                }
            ]
        });
    }
    
    createGridPipeline = async () => {
        const gridBindGroupLayout = this.gridBindGroupLayout;
        const gridPipeline_layout = this.device.createPipelineLayout({
            bindGroupLayouts: [gridBindGroupLayout]
        });

        this.gridPipeline = this.device.createRenderPipeline({
            label: "Grid Pipeline",
            layout: gridPipeline_layout,
            vertex: {
                module: this.device.createShaderModule({
                    code: gridShader,
                }),
                entryPoint: 'vertMain',
            },
            fragment: {
                module: this.device.createShaderModule({
                    code: gridShader,
                }),
                entryPoint: 'fragMain',
                targets: [
                    {
                        format: "bgra8unorm",
                        blend: {
                            color: {
                                srcFactor: 'src-alpha',
                                dstFactor: 'one-minus-src-alpha',
                                operation: 'add'
                            },
                            alpha: {
                                srcFactor: 'one',
                                dstFactor: 'one-minus-src-alpha',
                                operation: 'add'
                            }
                        }
                    }
                ]
            },
            primitive: {
                topology: "triangle-strip",
                stripIndexFormat: "uint32"
            },
            depthStencil: {
                depthWriteEnabled: false,
                depthCompare: 'less',
                format: 'depth24plus'
            }
        });
    }
}