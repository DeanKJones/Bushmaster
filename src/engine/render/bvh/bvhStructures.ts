import { AABB } from '../../voxel/util/aabb';

/**
 * Node in the Bottom-Level Acceleration Structure (BLAS)
 * Can be either an internal node or a leaf node containing voxel data
 */
export interface BLASNode {
    /**
     * Bounding box for this node
     */
    aabb: AABB;
    
    /**
     * Whether this is a leaf node (contains voxel) or internal node
     */
    isLeaf: boolean;
    
    /**
     * Index to first child (for internal nodes) or voxel data (for leaf nodes)
     */
    firstChildOrVoxelIndex: number;
    
    /**
     * Number of child nodes (0 for leaf nodes)
     */
    childCount: number;
    
    /**
     * Material index (used only for leaf nodes)
     */
    materialIdx: number;
    
    /**
     * Occupancy mask (8-bit) for partially filled voxels
     */
    occupancyMask: number;
    
    /**
     * Level of detail for this node
     */
    lodLevel: number;
}

/**
 * Node in the Top-Level Acceleration Structure (TLAS)
 * Used to organize multiple BLAS instances in the scene
 */
export interface TLASNode {
    /**
     * Bounding box for this node
     */
    aabb: AABB;
    
    /**
     * Left child index (0 for leaf nodes)
     */
    left: number;
    
    /**
     * Right child index (0 for leaf nodes)
     */
    right: number;
    
    /**
     * BLAS instance index (only valid for leaf nodes)
     */
    blasInstanceIndex: number;
}

/**
 * Instance of a BLAS in the scene with its own transform
 */
export interface BLASInstance {
    /**
     * Transformation matrix (4x4)
     */
    transform: number[];
    
    /**
     * Inverse transformation matrix (4x4)
     */
    transformInverse: number[];
    
    /**
     * Offset to the BLAS in the node buffer
     */
    blasOffset: number;
    
    /**
     * Material index override (if needed)
     */
    materialIdx: number;
}

/**
 * Material properties for a voxel
 */
export interface VoxelMaterial {
    /**
     * Base color [r, g, b]
     */
    color: [number, number, number];
    
    /**
     * Roughness (0-1)
     */
    roughness: number;
    
    /**
     * Metalness (0-1)
     */
    metalness: number;
    
    /**
     * Emission color [r, g, b]
     */
    emission: [number, number, number];
    
    /**
     * Emission strength
     */
    emissionStrength: number;
}