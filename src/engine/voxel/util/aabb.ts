/**
 * Axis-Aligned Bounding Box implementation
 */
export class AABB {
    /**
     * Minimum corner of the bounding box
     */
    min: [number, number, number];
    
    /**
     * Maximum corner of the bounding box
     */
    max: [number, number, number];
    
    constructor(
        min: [number, number, number] = [Infinity, Infinity, Infinity],
        max: [number, number, number] = [-Infinity, -Infinity, -Infinity]
    ) {
        this.min = [...min];
        this.max = [...max];
    }
    
    /**
     * Creates a deep copy of this AABB
     */
    clone(): AABB {
        return new AABB([...this.min], [...this.max]);
    }
    
    /**
     * Calculates the surface area of the AABB
     */
    surfaceArea(): number {
        const width = this.max[0] - this.min[0];
        const height = this.max[1] - this.min[1];
        const depth = this.max[2] - this.min[2];
        
        return 2 * (width * height + height * depth + depth * width);
    }
    
    /**
     * Grows the AABB to include the given point
     */
    expandByPoint(point: [number, number, number]): void {
        this.min = [
            Math.min(this.min[0], point[0]),
            Math.min(this.min[1], point[1]),
            Math.min(this.min[2], point[2])
        ];
        
        this.max = [
            Math.max(this.max[0], point[0]),
            Math.max(this.max[1], point[1]),
            Math.max(this.max[2], point[2])
        ];
    }
    
    /**
     * Expands this AABB to enclose another AABB
     */
    expandByAABB(other: AABB): void {
        this.expandByPoint(other.min);
        this.expandByPoint(other.max);
    }
    
    /**
     * Checks if this AABB contains the specified point
     */
    containsPoint(point: [number, number, number]): boolean {
        return (
            point[0] >= this.min[0] && point[0] <= this.max[0] &&
            point[1] >= this.min[1] && point[1] <= this.max[1] &&
            point[2] >= this.min[2] && point[2] <= this.max[2]
        );
    }
    
    /**
     * Checks if this AABB contains another AABB completely
     */
    containsAABB(other: AABB): boolean {
        return (
            this.containsPoint(other.min) &&
            this.containsPoint(other.max)
        );
    }
    
    /**
     * Checks if this AABB intersects with another AABB
     */
    intersectsAABB(other: AABB): boolean {
        return !(
            other.min[0] > this.max[0] || other.max[0] < this.min[0] ||
            other.min[1] > this.max[1] || other.max[1] < this.min[1] ||
            other.min[2] > this.max[2] || other.max[2] < this.min[2]
        );
    }
    
    /**
     * Gets the center point of the AABB
     */
    getCenter(): [number, number, number] {
        return [
            (this.min[0] + this.max[0]) / 2,
            (this.min[1] + this.max[1]) / 2,
            (this.min[2] + this.max[2]) / 2
        ];
    }
    
    /**
     * Transforms this AABB by a 4x4 matrix
     */
    applyMatrix(matrix: number[]): void {
        // Get all 8 corners of the box
        const corners = [
            [this.min[0], this.min[1], this.min[2]],
            [this.min[0], this.min[1], this.max[2]],
            [this.min[0], this.max[1], this.min[2]],
            [this.min[0], this.max[1], this.max[2]],
            [this.max[0], this.min[1], this.min[2]],
            [this.max[0], this.min[1], this.max[2]],
            [this.max[0], this.max[1], this.min[2]],
            [this.max[0], this.max[1], this.max[2]],
        ];
        
        // Reset bounds
        this.min = [Infinity, Infinity, Infinity];
        this.max = [-Infinity, -Infinity, -Infinity];
        
        // Transform each corner and expand bounds
        for (const corner of corners) {
            // Apply matrix transform
            const transformed = [
                matrix[0] * corner[0] + matrix[4] * corner[1] + matrix[8] * corner[2] + matrix[12],
                matrix[1] * corner[0] + matrix[5] * corner[1] + matrix[9] * corner[2] + matrix[13],
                matrix[2] * corner[0] + matrix[6] * corner[1] + matrix[10] * corner[2] + matrix[14]
            ] as [number, number, number];
            
            // Expand bounds
            this.expandByPoint(transformed);
        }
    }
}