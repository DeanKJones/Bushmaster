/**
 * Represents a single voxel in 3D space
 */
export class Voxel {
    /**
     * Position of the voxel's center
     */
    position: [number, number, number];
    
    /**
     * Size of the voxel (assumes cubic voxels)
     */
    size: number;
    
    /**
     * Material index to use for this voxel
     */
    materialIdx: number;
    
    /**
     * Level of detail for hierarchical rendering (0 = highest detail)
     */
    lodLevel: number;
    
    /**
     * 8-bit mask for partially filled voxels
     * Each bit represents one octant
     */
    occupancyMask: number;
    
    // Cached bounding box corners
    private minCorner: [number, number, number];
    private maxCorner: [number, number, number];
    
    constructor(
        position: [number, number, number],
        size: number,
        materialIdx: number = 0,
        lodLevel: number = 0,
        occupancyMask: number = 0xFF // Default to fully occupied
    ) {
        this.position = position;
        this.size = size;
        this.materialIdx = materialIdx;
        this.lodLevel = lodLevel;
        this.occupancyMask = occupancyMask;
        
        // Pre-calculate bounding box
        const halfSize = size / 2;
        this.minCorner = [
            position[0] - halfSize,
            position[1] - halfSize,
            position[2] - halfSize
        ];
        this.maxCorner = [
            position[0] + halfSize,
            position[1] + halfSize,
            position[2] + halfSize
        ];
    }
    
    /**
     * Returns the minimum corner of the voxel's bounding box
     */
    getMin(): [number, number, number] {
        return this.minCorner;
    }
    
    /**
     * Returns the maximum corner of the voxel's bounding box
     */
    getMax(): [number, number, number] {
        return this.maxCorner;
    }
    
    /**
     * Checks if a point is inside this voxel
     */
    containsPoint(point: [number, number, number]): boolean {
        return (
            point[0] >= this.minCorner[0] && point[0] <= this.maxCorner[0] &&
            point[1] >= this.minCorner[1] && point[1] <= this.maxCorner[1] &&
            point[2] >= this.minCorner[2] && point[2] <= this.maxCorner[2]
        );
    }
    
    /**
     * Creates child voxels (for LOD)
     */
    createChildren(): Voxel[] {
        if (this.lodLevel === 0) {
            // Can't subdivide lowest level
            return [];
        }
        
        const childSize = this.size / 2;
        const childLodLevel = this.lodLevel - 1;
        const children: Voxel[] = [];
        
        // Create 8 children (octree structure)
        for (let x = 0; x < 2; x++) {
            for (let y = 0; y < 2; y++) {
                for (let z = 0; z < 2; z++) {
                    const offsetX = x === 0 ? -childSize/2 : childSize/2;
                    const offsetY = y === 0 ? -childSize/2 : childSize/2;
                    const offsetZ = z === 0 ? -childSize/2 : childSize/2;
                    
                    const childPos: [number, number, number] = [
                        this.position[0] + offsetX,
                        this.position[1] + offsetY,
                        this.position[2] + offsetZ
                    ];
                    
                    // Check if this octant is occupied in the parent
                    const octantIdx = (x << 0) | (y << 1) | (z << 2);
                    const isOccupied = (this.occupancyMask & (1 << octantIdx)) !== 0;
                    
                    if (isOccupied) {
                        children.push(new Voxel(
                            childPos,
                            childSize,
                            this.materialIdx,
                            childLodLevel
                        ));
                    }
                }
            }
        }
        
        return children;
    }
}