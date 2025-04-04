import { BLAS } from '../render/bvh/blas';
import { BLASInstance, VoxelMaterial } from '../render/bvh/bvhStructures';
import { TLAS } from '../render/bvh/tlas';
import { Voxel } from '../voxel/voxel';
import { FractalGenerator } from '../voxel/generators/fractalGenerator';

/**
 * Manages a scene made of voxels, including BVH structures and instances
 */
export class VoxelScene {
    /**
     * All BLAS structures in the scene
     */
    blasArray: BLAS[] = [];
    
    /**
     * All BLAS instances in the scene
     */
    blasInstances: BLASInstance[] = [];
    
    /**
     * Map of BLAS offset to BLAS object
     */
    private blasOffsetMap: Map<number, BLAS> = new Map();
    
    /**
     * The top-level acceleration structure
     */
    tlas!: TLAS;
    
    /**
     * All materials in the scene
     */
    materials: VoxelMaterial[] = [];
    
    /**
     * Total node count for calculating offsets
     */
    private totalNodeCount: number = 0;
    
    constructor() {
        // Initialize default materials
        this.initializeDefaultMaterials();
    }
    
    /**
     * Initialize some default materials
     */
    private initializeDefaultMaterials(): void {
        this.materials = [
            // Default white
            { 
                color: [1.0, 1.0, 1.0], 
                roughness: 0.7, 
                metalness: 0.0,
                emission: [0.0, 0.0, 0.0],
                emissionStrength: 0.0
            },
            // Red
            { 
                color: [1.0, 0.2, 0.2], 
                roughness: 0.5, 
                metalness: 0.0,
                emission: [0.0, 0.0, 0.0],
                emissionStrength: 0.0
            },
            // Green
            { 
                color: [0.2, 1.0, 0.2], 
                roughness: 0.5, 
                metalness: 0.0,
                emission: [0.0, 0.0, 0.0],
                emissionStrength: 0.0
            },
            // Blue
            { 
                color: [0.2, 0.2, 1.0], 
                roughness: 0.5, 
                metalness: 0.0,
                emission: [0.0, 0.0, 0.0],
                emissionStrength: 0.0
            },
            // Yellow
            { 
                color: [1.0, 1.0, 0.2], 
                roughness: 0.5, 
                metalness: 0.0,
                emission: [0.0, 0.0, 0.0],
                emissionStrength: 0.0 
            },
            // Metal
            { 
                color: [0.8, 0.8, 0.8], 
                roughness: 0.1, 
                metalness: 0.9,
                emission: [0.0, 0.0, 0.0],
                emissionStrength: 0.0
            },
            // Light source
            { 
                color: [1.0, 0.9, 0.7], 
                roughness: 0.0, 
                metalness: 0.0,
                emission: [1.0, 0.9, 0.7],
                emissionStrength: 5.0 
            }
        ];
    }
    
    /**
     * Create a demo scene with fractal voxel structures
     */
    createDemoScene(): void {
        // 1. First, create a Sphereflake fractal
        const sphereflakeVoxels = FractalGenerator.generateSphereflake(3, 1.0, 0, 3);
        this.createBLAS("sphereflake", sphereflakeVoxels);
        
        // 2. Create a Menger sponge fractal
        const spongeVoxels = FractalGenerator.generateMengerSponge(2, 1.0, 1, 2);
        this.createBLAS("menger_sponge", spongeVoxels);
        
        // 3. Create multiple instances of the Sphereflake
        const sphereflakeInstances = FractalGenerator.createFractalInstances(
            this.getBlasOffset("sphereflake"),
            7,  // Create 7 instances
            0   // Starting with material 0
        );
        this.blasInstances.push(...sphereflakeInstances);
        
        // 4. Create a few instances of the Menger sponge
        const spongeInstances = FractalGenerator.createFractalInstances(
            this.getBlasOffset("menger_sponge"),
            3,  // Create 3 instances
            2   // Starting with material 2
        );
        this.blasInstances.push(...spongeInstances);
        
        // 5. Add a bright sphere for lighting
        const lightVoxels = [new Voxel([0, 5, 0], 1.0, 6, 1)];
        this.createBLAS("light", lightVoxels);
        
        // Add a single instance of the light
        this.blasInstances.push({
            transform: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 5, 0, 1],
            transformInverse: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, -5, 0, 1],
            blasOffset: this.getBlasOffset("light"),
            materialIdx: 6
        });
        
        // Finally, build the TLAS
        this.buildTLAS();
    }
    
    /**
     * Create a BLAS from voxels
     */
    createBLAS(id: string, voxels: Voxel[]): BLAS {
        // Create the BLAS
        const blas = new BLAS(id, voxels);
        
        // Add to our arrays and maps
        this.blasArray.push(blas);
        const offset = this.totalNodeCount;
        this.blasOffsetMap.set(offset, blas);
        
        // Update total node count
        this.totalNodeCount += blas.nodes.length;
        
        return blas;
    }
    
    /**
     * Get BLAS offset by ID
     */
    getBlasOffset(id: string): number {
        for (const [offset, blas] of this.blasOffsetMap.entries()) {
            if (blas.id === id) {
                return offset;
            }
        }
        console.error(`BLAS with ID '${id}' not found`);
        return 0;
    }
    
    /**
     * Build the TLAS from BLAS instances
     */
    buildTLAS(): void {
        this.tlas = new TLAS(this.blasInstances, this.blasOffsetMap);
    }
    
    /**
     * Get all BLAS nodes flattened for GPU upload
     */
    getFlattenedBlasNodes(): any[] {
        const allNodes: any[] = [];
        
        for (const blas of this.blasArray) {
            allNodes.push(...blas.getNodes());
        }
        
        return allNodes;
    }
    
    /**
     * Get all voxels flattened for GPU upload
     */
    getFlattenedVoxels(): Voxel[] {
        const allVoxels: Voxel[] = [];
        
        for (const blas of this.blasArray) {
            allVoxels.push(...blas.voxels);
        }
        
        return allVoxels;
    }
}