import { AABB } from '../../voxel/util/aabb';
import { Voxel } from '../../voxel/voxel';
import { BLASNode } from './bvhStructures';

/**
 * Bottom-Level Acceleration Structure for voxel data
 */
export class BLAS {
    /**
     * Unique identifier for this BLAS
     */
    id: string;
    
    /**
     * Voxels stored in this BLAS
     */
    voxels: Voxel[];
    
    /**
     * All nodes in the BLAS tree
     */
    nodes: BLASNode[];
    
    /**
     * Index of the root node
     */
    rootNodeIdx: number = 0;
    
    /**
     * Number of nodes in use
     */
    nodeCount: number = 0;
    
    /**
     * Maximum LOD level in this BLAS
     */
    maxLodLevel: number = 0;
    
    /**
     * Mapping from voxel index to node index
     */
    private voxelToNodeMap: Map<number, number> = new Map();
    
    constructor(id: string, voxels: Voxel[]) {
        this.id = id;
        this.voxels = voxels;
        
        // Find the highest LOD level
        this.maxLodLevel = Math.max(0, ...voxels.map(v => v.lodLevel));
        
        // Pre-allocate nodes (worst case: each voxel becomes a leaf + internal nodes)
        // For a perfect octree with N leaves, we need at most 2N-1 nodes
        this.nodes = new Array<BLASNode>(Math.max(1, voxels.length * 2));
        
        // Initialize with 1 for the root node
        this.nodeCount = 1;
        
        // Build the tree
        this.buildTree();
    }
    
    /**
     * Build the BVH tree
     */
    private buildTree(): void {
        // Create the root node
        const rootAABB = new AABB();
        
        // Expand the root AABB to contain all voxels
        for (const voxel of this.voxels) {
            rootAABB.expandByPoint(voxel.getMin());
            rootAABB.expandByPoint(voxel.getMax());
        }
        
        // Initialize the root node
        this.nodes[this.rootNodeIdx] = {
            aabb: rootAABB,
            isLeaf: false,
            firstChildOrVoxelIndex: 0,
            childCount: 0,
            materialIdx: 0,
            occupancyMask: 0xFF, // All bits set - fully occupied
            lodLevel: this.maxLodLevel
        };
        
        // Build the tree recursively
        this.subdivideNode(this.rootNodeIdx, this.voxels, this.maxLodLevel);
    }
    
    /**
     * Subdivide a node into children
     */
    private subdivideNode(nodeIdx: number, nodeVoxels: Voxel[], currentLod: number): void {
        const node = this.nodes[nodeIdx];
        
        // Base case: If we're at the lowest LOD or have only one voxel, make this a leaf
        if (currentLod === 0 || nodeVoxels.length === 1) {
            // Make this a leaf node with the voxel data
            const voxel = nodeVoxels[0];
            node.isLeaf = true;
            node.firstChildOrVoxelIndex = this.voxels.indexOf(voxel);
            node.childCount = 0;
            node.materialIdx = voxel.materialIdx;
            node.occupancyMask = voxel.occupancyMask;
            node.lodLevel = voxel.lodLevel;
            
            // Map voxel index to this node
            this.voxelToNodeMap.set(node.firstChildOrVoxelIndex, nodeIdx);
            return;
        }
        
        // Get the center of this node's AABB
        const center = node.aabb.getCenter();
        
        // Divide voxels into 8 octants
        const octants: Voxel[][] = Array(8).fill(null).map(() => []);
        
        // Sort voxels into octants
        for (const voxel of nodeVoxels) {
            const voxelCenter = voxel.position;
            const octantIdx = this.getOctantIndex(voxelCenter, center);
            octants[octantIdx].push(voxel);
        }
        
        // Create child nodes for non-empty octants
        const childIndices: number[] = [];
        let childCount = 0;
        
        for (let i = 0; i < 8; i++) {
            if (octants[i].length > 0) {
                // Create a new node for this octant
                const childNodeIdx = this.nodeCount++;
                childIndices.push(childNodeIdx);
                childCount++;
                
                // Calculate AABB for this octant
                const childAABB = this.calculateOctantAABB(node.aabb, i, center);
                
                // Initialize the child node
                this.nodes[childNodeIdx] = {
                    aabb: childAABB,
                    isLeaf: false,
                    firstChildOrVoxelIndex: 0, // Will be set during recursive call
                    childCount: 0,
                    materialIdx: 0,
                    occupancyMask: 0xFF,
                    lodLevel: currentLod - 1
                };
                
                // Recursively subdivide this octant
                this.subdivideNode(childNodeIdx, octants[i], currentLod - 1);
            }
        }
        
        // Update the current node to point to its children
        if (childCount > 0) {
            node.isLeaf = false;
            node.firstChildOrVoxelIndex = childIndices[0]; // Index of first child
            node.childCount = childCount;
        } else {
            // This shouldn't happen if we have voxels, but just in case
            node.isLeaf = true;
            node.firstChildOrVoxelIndex = this.voxels.indexOf(nodeVoxels[0]);
            node.childCount = 0;
        }
        
        // Update the node
        this.nodes[nodeIdx] = node;
    }
    
    /**
     * Get the octant index for a point relative to a center
     */
    private getOctantIndex(point: [number, number, number], center: [number, number, number]): number {
        let octant = 0;
        if (point[0] >= center[0]) octant |= 1; // X
        if (point[1] >= center[1]) octant |= 2; // Y
        if (point[2] >= center[2]) octant |= 4; // Z
        return octant;
    }
    
    /**
     * Calculate AABB for an octant of a parent AABB
     */
    private calculateOctantAABB(parentAABB: AABB, octantIdx: number, center?: [number, number, number]): AABB {
        // Calculate center if not provided
        const centerPoint = center || parentAABB.getCenter();
        
        // Create a new AABB
        const octantAABB = new AABB();
        
        // Determine which half of each dimension to use
        const useMaxX = (octantIdx & 1) !== 0;
        const useMaxY = (octantIdx & 2) !== 0;
        const useMaxZ = (octantIdx & 4) !== 0;
        
        // Set min bounds
        octantAABB.min = [
            useMaxX ? centerPoint[0] : parentAABB.min[0],
            useMaxY ? centerPoint[1] : parentAABB.min[1],
            useMaxZ ? centerPoint[2] : parentAABB.min[2]
        ];
        
        // Set max bounds
        octantAABB.max = [
            useMaxX ? parentAABB.max[0] : centerPoint[0],
            useMaxY ? parentAABB.max[1] : centerPoint[1],
            useMaxZ ? parentAABB.max[2] : centerPoint[2]
        ];
        
        return octantAABB;
    }
    
    /**
     * Get a flattened array of all nodes for GPU upload
     */
    getNodes(): BLASNode[] {
        return this.nodes.slice(0, this.nodeCount);
    }
}