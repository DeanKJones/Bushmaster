import { Voxel } from '../voxel';
import { Mat4 } from '../../math/mat4';
import { BLASInstance } from '../../render/bvh/bvhStructures';

/**
 * Generates various fractal voxel structures for demos
 */
export class FractalGenerator {
    /**
     * Generate a sphere fractal (aka a "sphereflake")
     * @param depth Maximum recursion depth
     * @param scale Initial scale of the root sphere
     * @param materialIdx Material index to use
     * @param maxLOD Maximum level of detail (for LOD system)
     * @returns Array of voxels forming the sphereflake
     */
    static generateSphereflake(
        depth: number = 4,
        scale: number = 1.0,
        materialIdx: number = 0,
        maxLOD: number = 4
    ): Voxel[] {
        const voxels: Voxel[] = [];
        
        // Start with a central sphere
        const center: [number, number, number] = [0, 0, 0];
        
        // Add the root sphere
        voxels.push(new Voxel(
            center,
            scale,
            materialIdx,
            maxLOD // Highest LOD level
        ));
        
        // Generate the recursive pattern
        this.generateSphereflakeRecursive(
            voxels,
            center,
            scale,
            depth,
            materialIdx,
            maxLOD,
            null
        );
        
        return voxels;
    }
    
    /**
     * Recursive helper for sphereflake generation
     */
    private static generateSphereflakeRecursive(
        voxels: Voxel[],
        center: [number, number, number],
        scale: number,
        depth: number,
        materialIdx: number,
        lodLevel: number,
        excludeDir: [number, number, number] | null
    ): void {
        if (depth <= 0) return;
        
        // Child sphere scale
        const childScale = scale * 0.4;
        
        // Distance from center to child
        const distance = scale + childScale;
        
        // Generate child spheres in these directions
        const directions: [number, number, number][] = [
            [1, 0, 0],   // +X
            [-1, 0, 0],  // -X
            [0, 1, 0],   // +Y
            [0, -1, 0],  // -Y
            [0, 0, 1],   // +Z
            [0, 0, -1],  // -Z
            [0.707, 0.707, 0],    // +X+Y
            [0.707, -0.707, 0],   // +X-Y
            [-0.707, 0.707, 0],   // -X+Y
            [-0.707, -0.707, 0],  // -X-Y
            [0.707, 0, 0.707],    // +X+Z
            [0.707, 0, -0.707],   // +X-Z
            [-0.707, 0, 0.707],   // -X+Z
            [-0.707, 0, -0.707],  // -X-Z
            [0, 0.707, 0.707],    // +Y+Z
            [0, 0.707, -0.707],   // +Y-Z
            [0, -0.707, 0.707],   // -Y+Z
            [0, -0.707, -0.707],  // -Y-Z
        ];
        
        // Add child spheres
        for (const dir of directions) {
            // Skip the direction we came from (to avoid overlap)
            if (excludeDir && 
                Math.abs(dir[0] + excludeDir[0]) < 0.001 && 
                Math.abs(dir[1] + excludeDir[1]) < 0.001 && 
                Math.abs(dir[2] + excludeDir[2]) < 0.001) {
                continue;
            }
            
            // Normalize the direction
            const length = Math.sqrt(dir[0]*dir[0] + dir[1]*dir[1] + dir[2]*dir[2]);
            const normDir: [number, number, number] = [
                dir[0] / length,
                dir[1] / length,
                dir[2] / length
            ];
            
            // Calculate child position
            const childPos: [number, number, number] = [
                center[0] + normDir[0] * distance,
                center[1] + normDir[1] * distance,
                center[2] + normDir[2] * distance
            ];
            
            // Add the child voxel
            voxels.push(new Voxel(
                childPos,
                childScale,
                materialIdx,
                Math.max(0, lodLevel - 1) // Reduce LOD with depth
            ));
            
            // Recurse for this child (but skip the direction back to parent)
            this.generateSphereflakeRecursive(
                voxels,
                childPos,
                childScale,
                depth - 1,
                materialIdx,
                Math.max(0, lodLevel - 1),
                normDir
            );
        }
    }
    
    /**
     * Generate a Menger sponge fractal
     * @param depth Recursion depth (1-4 recommended)
     * @param size Initial size of the cube
     * @param materialIdx Material index to use
     * @param maxLOD Maximum level of detail
     * @returns Array of voxels forming the Menger sponge
     */
    static generateMengerSponge(
        depth: number = 3,
        size: number = 1.0,
        materialIdx: number = 0,
        maxLOD: number = 3
    ): Voxel[] {
        const voxels: Voxel[] = [];
        
        // Start with a central cube
        this.generateMengerSpongeRecursive(
            voxels,
            [0, 0, 0],
            size,
            depth,
            materialIdx,
            maxLOD
        );
        
        return voxels;
    }
    
    /**
     * Recursive helper for Menger sponge generation
     */
    private static generateMengerSpongeRecursive(
        voxels: Voxel[],
        center: [number, number, number],
        size: number,
        depth: number,
        materialIdx: number,
        lodLevel: number
    ): void {
        if (depth === 0) {
            // Add a voxel at the lowest recursion level
            voxels.push(new Voxel(
                center,
                size,
                materialIdx,
                lodLevel
            ));
            return;
        }
        
        // Calculate new size for subcubes
        const newSize = size / 3;
        
        // Generate the 20 subcubes (27 total minus 7 removed)
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    // Skip the center and the three axes that pass through the center
                    if ((x === 0 && y === 0) || 
                        (x === 0 && z === 0) || 
                        (y === 0 && z === 0)) {
                        continue;
                    }
                    
                    // Calculate new center
                    const newCenter: [number, number, number] = [
                        center[0] + x * newSize,
                        center[1] + y * newSize,
                        center[2] + z * newSize
                    ];
                    
                    // Recurse
                    this.generateMengerSpongeRecursive(
                        voxels,
                        newCenter,
                        newSize,
                        depth - 1,
                        materialIdx,
                        Math.max(0, lodLevel - 1)
                    );
                }
            }
        }
    }
    
    /**
     * Create instances of a BLAS with appropriate transforms
     * @param blasOffset The offset to the BLAS in the buffer
     * @param count Number of instances to create
     * @param materialIdxBase Base material index
     */
    static createFractalInstances(
        blasOffset: number,
        count: number = 10,
        materialIdxBase: number = 0
    ): BLASInstance[] {
        const instances: BLASInstance[] = [];
        
        // Create a ring of instances around the origin
        for (let i = 0; i < count; i++) {
            // Calculate position on a circle
            const angle = (i / count) * Math.PI * 2;
            const radius = 5.0;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // Calculate a scale factor that varies with position
            const scale = 0.5 + 0.3 * Math.sin(angle * 3);
            
            // Create transformation matrix
            const transform = Mat4.identity();
            
            // Apply transformations: First scale, then rotate, then translate
            Mat4.translate(transform, transform, [x, 0, z]);
            Mat4.rotateY(transform, transform, angle);
            Mat4.scale(transform, transform, [scale, scale, scale]);
            
            // Calculate inverse matrix
            const inverse = Mat4.inverse(transform);
            
            // Create the instance
            instances.push({
                transform,
                transformInverse: inverse,
                blasOffset,
                materialIdx: materialIdxBase + (i % 5) // Cycle through 5 materials
            });
        }
        
        return instances;
    }
}
