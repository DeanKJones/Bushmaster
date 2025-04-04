import { VoxelScene } from '../../../scene/voxelScene';
import { BLASNode, TLASNode } from '../../bvh/bvhStructures';

/**
 * Manages GPU buffers for voxel rendering
 */
export class VoxelBufferManager {
    private device: GPUDevice;
    private scene: VoxelScene;
    
    // Buffers for voxel data
    voxelBuffer!: GPUBuffer;
    blasNodeBuffer!: GPUBuffer;
    tlasNodeBuffer!: GPUBuffer;
    blasInstanceBuffer!: GPUBuffer;
    materialBuffer!: GPUBuffer;
    
    constructor(device: GPUDevice, scene: VoxelScene) {
        this.device = device;
        this.scene = scene;
    }
    
    /**
     * Initialize and create all voxel buffers
     */
    initialize(): void {
        this.createVoxelBuffer();
        this.createBlasNodeBuffer();
        this.createTlasNodeBuffer();
        this.createBlasInstanceBuffer();
        this.createMaterialBuffer();
    }
    
    /**
     * Create buffer for voxel data
     */
    private createVoxelBuffer(): void {
        const voxels = this.scene.getFlattenedVoxels();
        
        // Each voxel is represented by:
        // position (3 floats), size (1 float), materialIdx (1 uint), 
        // occupancyMask (1 uint), lodLevel (1 uint), padding (1 uint)
        // = 8 * 4 bytes = 32 bytes per voxel
        const voxelData = new Float32Array(voxels.length * 8);
        
        // Create view as Uint32Array for writing integers
        const voxelDataU32 = new Uint32Array(voxelData.buffer);
        
        for (let i = 0; i < voxels.length; i++) {
            const voxel = voxels[i];
            const baseOffset = i * 8;
            
            // Position (3 floats)
            voxelData[baseOffset] = voxel.position[0];
            voxelData[baseOffset + 1] = voxel.position[1];
            voxelData[baseOffset + 2] = voxel.position[2];
            
            // Material index (1 uint)
            voxelDataU32[baseOffset + 3] = voxel.materialIdx;
            
            // Size (1 float)
            voxelData[baseOffset + 4] = voxel.size;
            
            // Occupancy mask (1 uint)
            voxelDataU32[baseOffset + 5] = voxel.occupancyMask;
            
            // LOD level (1 uint)
            voxelDataU32[baseOffset + 6] = voxel.lodLevel;
            
            // Padding (1 uint/float)
            voxelData[baseOffset + 7] = 0;
        }
        
        // Create GPU buffer
        this.voxelBuffer = this.device.createBuffer({
            label: 'Voxel Data Buffer',
            size: voxelData.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        
        // Upload data
        this.device.queue.writeBuffer(this.voxelBuffer, 0, voxelData);
    }
    
    /**
     * Create buffer for BLAS nodes
     */
    private createBlasNodeBuffer(): void {
        const blasNodes = this.scene.getFlattenedBlasNodes();
        
        // Each BLAS node is represented by:
        // aabb.min (3 floats), flags (1 uint),
        // aabb.max (3 floats), firstChildOrVoxelIndex (1 uint)
        // = 8 * 4 bytes = 32 bytes per node
        const nodeData = new Float32Array(blasNodes.length * 8);
        
        // Create view as Uint32Array for writing integers
        const nodeDataU32 = new Uint32Array(nodeData.buffer);
        
        for (let i = 0; i < blasNodes.length; i++) {
            const node = blasNodes[i] as BLASNode;
            const baseOffset = i * 8;
            
            // AABB minimum (3 floats)
            nodeData[baseOffset] = node.aabb.min[0];
            nodeData[baseOffset + 1] = node.aabb.min[1];
            nodeData[baseOffset + 2] = node.aabb.min[2];
            
            // Pack flags into one uint32
            // isLeaf (1 bit) | childCount (7 bits) | lodLevel (8 bits) | occupancyMask (8 bits) | padding (8 bits)
            const flags = 
                (node.isLeaf ? 1 : 0) |
                ((node.childCount & 0x7F) << 1) |
                ((node.lodLevel & 0xFF) << 8) |
                ((node.occupancyMask & 0xFF) << 16);
            nodeDataU32[baseOffset + 3] = flags;
            
            // AABB maximum (3 floats)
            nodeData[baseOffset + 4] = node.aabb.max[0];
            nodeData[baseOffset + 5] = node.aabb.max[1];
            nodeData[baseOffset + 6] = node.aabb.max[2];
            
            // First child or voxel index (1 uint)
            nodeDataU32[baseOffset + 7] = node.firstChildOrVoxelIndex;
        }
        
        // Create GPU buffer
        this.blasNodeBuffer = this.device.createBuffer({
            label: 'BLAS Node Buffer',
            size: nodeData.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        
        // Upload data
        this.device.queue.writeBuffer(this.blasNodeBuffer, 0, nodeData);
    }
    
    /**
     * Create buffer for TLAS nodes
     */
    private createTlasNodeBuffer(): void {
        const tlasNodes = this.scene.tlas.getNodes();
        
        // Each TLAS node is represented by:
        // aabb.min (3 floats), left (1 uint),
        // aabb.max (3 floats), right (1 uint),
        // blasInstanceIndex (1 uint), padding (3 uints)
        // = 12 * 4 bytes = 48 bytes per node
        const nodeData = new Float32Array(tlasNodes.length * 12);
        
        // Create view as Uint32Array for writing integers
        const nodeDataU32 = new Uint32Array(nodeData.buffer);
        
        for (let i = 0; i < tlasNodes.length; i++) {
            const node = tlasNodes[i] as TLASNode;
            const baseOffset = i * 12;
            
            // AABB minimum (3 floats)
            nodeData[baseOffset] = node.aabb.min[0];
            nodeData[baseOffset + 1] = node.aabb.min[1];
            nodeData[baseOffset + 2] = node.aabb.min[2];
            
            // Left child (1 uint)
            nodeDataU32[baseOffset + 3] = node.left;
            
            // AABB maximum (3 floats)
            nodeData[baseOffset + 4] = node.aabb.max[0];
            nodeData[baseOffset + 5] = node.aabb.max[1];
            nodeData[baseOffset + 6] = node.aabb.max[2];
            
            // Right child (1 uint)
            nodeDataU32[baseOffset + 7] = node.right;
            
            // BLAS instance index (1 uint)
            nodeDataU32[baseOffset + 8] = node.blasInstanceIndex;
            
            // Padding (3 uints)
            nodeDataU32[baseOffset + 9] = 0;
            nodeDataU32[baseOffset + 10] = 0;
            nodeDataU32[baseOffset + 11] = 0;
        }
        
        // Create GPU buffer
        this.tlasNodeBuffer = this.device.createBuffer({
            label: 'TLAS Node Buffer',
            size: nodeData.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        
        // Upload data
        this.device.queue.writeBuffer(this.tlasNodeBuffer, 0, nodeData);
    }
    
    /**
     * Create buffer for BLAS instances
     */
    private createBlasInstanceBuffer(): void {
        const blasInstances = this.scene.blasInstances;
        
        // Each BLAS instance is represented by:
        // transform (16 floats), transformInverse (16 floats),
        // blasOffset (1 uint), materialIdx (1 uint), padding (2 uints)
        // = 36 * 4 bytes = 144 bytes per instance
        const instanceData = new Float32Array(blasInstances.length * 36);
        
        // Create view as Uint32Array for writing integers
        const instanceDataU32 = new Uint32Array(instanceData.buffer);
        
        for (let i = 0; i < blasInstances.length; i++) {
            const instance = blasInstances[i];
            const baseOffset = i * 36;
            
            // Transform matrix (16 floats)
            for (let j = 0; j < 16; j++) {
                instanceData[baseOffset + j] = instance.transform[j];
            }
            
            // Inverse transform matrix (16 floats)
            for (let j = 0; j < 16; j++) {
                instanceData[baseOffset + 16 + j] = instance.transformInverse[j];
            }
            
            // BLAS offset (1 uint)
            instanceDataU32[baseOffset + 32] = instance.blasOffset;
            
            // Material index (1 uint)
            instanceDataU32[baseOffset + 33] = instance.materialIdx;
            
            // Padding (2 uints)
            instanceDataU32[baseOffset + 34] = 0;
            instanceDataU32[baseOffset + 35] = 0;
        }
        
        // Create GPU buffer
        this.blasInstanceBuffer = this.device.createBuffer({
            label: 'BLAS Instance Buffer',
            size: instanceData.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        
        // Upload data
        this.device.queue.writeBuffer(this.blasInstanceBuffer, 0, instanceData);
    }
    
    /**
     * Create buffer for materials
     */
    private createMaterialBuffer(): void {
        const materials = this.scene.materials;
        
        // Each material is represented by:
        // color (3 floats), roughness (1 float),
        // emission (3 floats), emissionStrength (1 float),
        // metalness (1 float), padding (3 floats)
        // = 12 * 4 bytes = 48 bytes per material
        const materialData = new Float32Array(materials.length * 12);
        
        for (let i = 0; i < materials.length; i++) {
            const material = materials[i];
            const baseOffset = i * 12;
            
            // Color (3 floats)
            materialData[baseOffset] = material.color[0];
            materialData[baseOffset + 1] = material.color[1];
            materialData[baseOffset + 2] = material.color[2];
            
            // Roughness (1 float)
            materialData[baseOffset + 3] = material.roughness;
            
            // Emission color (3 floats)
            materialData[baseOffset + 4] = material.emission[0];
            materialData[baseOffset + 5] = material.emission[1];
            materialData[baseOffset + 6] = material.emission[2];
            
            // Emission strength (1 float)
            materialData[baseOffset + 7] = material.emissionStrength;
            
            // Metalness (1 float)
            materialData[baseOffset + 8] = material.metalness;
            
            // Padding (3 floats)
            materialData[baseOffset + 9] = 0;
            materialData[baseOffset + 10] = 0;
            materialData[baseOffset + 11] = 0;
        }
        
        // Create GPU buffer
        this.materialBuffer = this.device.createBuffer({
            label: 'Material Buffer',
            size: materialData.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        
        // Upload data
        this.device.queue.writeBuffer(this.materialBuffer, 0, materialData);
    }
    
    /**
     * Update all buffers (after scene changes)
     */
    updateBuffers(): void {
        // Re-create all buffers
        this.createVoxelBuffer();
        this.createBlasNodeBuffer();
        this.createTlasNodeBuffer();
        this.createBlasInstanceBuffer();
        this.createMaterialBuffer();
    }
}