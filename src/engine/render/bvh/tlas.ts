import { AABB } from '../../voxel/util/aabb';
import { BLASInstance, TLASNode } from './bvhStructures';
import { BLAS } from './blas';

/**
 * Top-Level Acceleration Structure for organizing BLAS instances
 */
export class TLAS {
    /**
     * All nodes in the TLAS tree
     */
    nodes: TLASNode[];
    
    /**
     * BLAS instances in the scene
     */
    blasInstances: BLASInstance[];
    
    /**
     * Map from BLAS offset to BLAS instance
     */
    private blasOffsetMap: Map<number, BLAS>;
    
    /**
     * Current count of used nodes
     */
    private nodeCount: number = 1; // Start at 1, index 0 reserved for root
    
    constructor(
        blasInstances: BLASInstance[],
        blasMap: Map<number, BLAS>
    ) {
        this.blasInstances = blasInstances;
        this.blasOffsetMap = blasMap;
        
        // Allocate space for nodes (2N-1 for a binary tree with N leaves)
        const maxNodes = Math.max(1, blasInstances.length * 2);
        this.nodes = new Array<TLASNode>(maxNodes);
        
        // Build the tree
        this.buildTree();
    }
    
    /**
     * Build the TLAS tree
     */
    private buildTree(): void {
        // Init leaf nodes for each BLAS instance
        const leafNodes: number[] = [];
        
        for (let i = 0; i < this.blasInstances.length; i++) {
            const instance = this.blasInstances[i];
            const blas = this.blasOffsetMap.get(instance.blasOffset);
            
            if (!blas) {
                console.error(`BLAS not found for offset ${instance.blasOffset}`);
                continue;
            }
            
            // Get the BLAS root AABB and transform it
            const blasAABB = blas.nodes[blas.rootNodeIdx].aabb.clone();
            blasAABB.applyMatrix(instance.transform);
            
            // Create a TLAS leaf node for this instance
            const nodeIdx = this.nodeCount++;
            this.nodes[nodeIdx] = {
                aabb: blasAABB,
                left: 0, // Leaf node
                right: 0, // Leaf node
                blasInstanceIndex: i
            };
            
            leafNodes.push(nodeIdx);
        }
        
        // Build the internal nodes using surface area heuristic (SAH)
        const rootIdx = this.buildHierarchy(leafNodes);
        
        // Copy the root node to index 0
        this.nodes[0] = { ...this.nodes[rootIdx] };
    }
    
    /**
     * Build the TLAS hierarchy using Surface Area Heuristic
     */
    private buildHierarchy(nodeIndices: number[]): number {
        // Base case: if there's just one node, return it
        if (nodeIndices.length === 1) {
            return nodeIndices[0];
        }
        
        // Find the best split using SAH
        const { axis, splitIndex } = this.findBestSplit(nodeIndices);
        
        // Split the nodes
        let leftIndices: number[];
        let rightIndices: number[];
        
        if (axis === -1 || splitIndex === -1) {
            // Fallback to median split
            const mid = Math.floor(nodeIndices.length / 2);
            leftIndices = nodeIndices.slice(0, mid);
            rightIndices = nodeIndices.slice(mid);
        } else {
            // Sort along the chosen axis
            nodeIndices.sort((a, b) => {
                const centerA = this.nodes[a].aabb.getCenter()[axis];
                const centerB = this.nodes[b].aabb.getCenter()[axis];
                return centerA - centerB;
            });
            
            leftIndices = nodeIndices.slice(0, splitIndex);
            rightIndices = nodeIndices.slice(splitIndex);
        }
        
        // Recursively build left and right subtrees
        const leftChildIdx = this.buildHierarchy(leftIndices);
        const rightChildIdx = this.buildHierarchy(rightIndices);
        
        // Create a parent node
        const parentAABB = new AABB();
        parentAABB.expandByAABB(this.nodes[leftChildIdx].aabb);
        parentAABB.expandByAABB(this.nodes[rightChildIdx].aabb);
        
        const parentIdx = this.nodeCount++;
        this.nodes[parentIdx] = {
            aabb: parentAABB,
            left: leftChildIdx,
            right: rightChildIdx,
            blasInstanceIndex: -1 // Not a leaf node
        };
        
        return parentIdx;
    }
    
    /**
     * Find the best split plane using Surface Area Heuristic
     */
    private findBestSplit(nodeIndices: number[]): { axis: number, splitIndex: number } {
        let bestCost = Infinity;
        let bestAxis = -1;
        let bestSplitIndex = -1;
        
        // Try each axis
        for (let axis = 0; axis < 3; axis++) {
            // Sort along this axis
            nodeIndices.sort((a, b) => {
                const centerA = this.nodes[a].aabb.getCenter()[axis];
                const centerB = this.nodes[b].aabb.getCenter()[axis];
                return centerA - centerB;
            });
            
            // Precompute left-to-right and right-to-left AABBs
            const leftAABBs: AABB[] = new Array(nodeIndices.length);
            const rightAABBs: AABB[] = new Array(nodeIndices.length);
            
            // Left to right
            let leftAABB = new AABB();
            for (let i = 0; i < nodeIndices.length; i++) {
                leftAABB = leftAABB.clone();
                leftAABB.expandByAABB(this.nodes[nodeIndices[i]].aabb);
                leftAABBs[i] = leftAABB;
            }
            
            // Right to left
            let rightAABB = new AABB();
            for (let i = nodeIndices.length - 1; i >= 0; i--) {
                rightAABB = rightAABB.clone();
                rightAABB.expandByAABB(this.nodes[nodeIndices[i]].aabb);
                rightAABBs[i] = rightAABB;
            }
            
            // Try each split position
            for (let i = 1; i < nodeIndices.length; i++) {
                const leftCount = i;
                const rightCount = nodeIndices.length - i;
                
                // Calculate SAH cost
                const leftSA = leftAABBs[i - 1].surfaceArea();
                const rightSA = rightAABBs[i].surfaceArea();
                
                const cost = leftSA * leftCount + rightSA * rightCount;
                
                if (cost < bestCost) {
                    bestCost = cost;
                    bestAxis = axis;
                    bestSplitIndex = i;
                }
            }
        }
        
        return { axis: bestAxis, splitIndex: bestSplitIndex };
    }
    
    /**
     * Get the flattened array of nodes for GPU upload
     */
    getNodes(): TLASNode[] {
        return this.nodes.slice(0, this.nodeCount);
    }
}