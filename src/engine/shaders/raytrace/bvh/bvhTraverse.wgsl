#include "../raytraceCommon.wgsl"
#include "../intersection/aabb.wgsl"
#include "../intersection/voxel.wgsl"

// Trace a ray through the BLAS
fn traceBLAS(ray: Ray, instance: BLASInstance, nodeIdx: u32) -> HitInfo {
    var hitInfo: HitInfo;
    hitInfo.hit = false;
    hitInfo.t = MAX_DISTANCE;
    
    // Transform ray to object space
    var objectRay: Ray;
    objectRay.origin = (instance.transformInverse * vec4f(ray.origin, 1.0)).xyz;
    objectRay.direction = normalize((instance.transformInverse * vec4f(ray.direction, 0.0)).xyz);
    
    // Initialize traversal stack
    var stack: array<u32, MAX_STACK_SIZE>;
    var stackPtr = 0u;
    stack[stackPtr] = nodeIdx;
    stackPtr += 1u;
    
    while (stackPtr > 0u) {
        stackPtr -= 1u;
        let currentNodeIdx = stack[stackPtr];
        let currentNode = blasNodes[currentNodeIdx];
        
        // Check if ray intersects node AABB
        let t = intersectAABB(objectRay, currentNode.aabbMin, currentNode.aabbMax);
        if (t < 0.0 || t > hitInfo.t) {
            continue; // Skip if no intersection or beyond closest hit
        }
        
        let flags = currentNode.flags;
        let isLeaf = isLeafNode(flags);
        
        if (isLeaf) {
            // Leaf node - intersect voxel
            let voxelIdx = currentNode.firstChildOrVoxelIndex;
            let voxel = voxels[voxelIdx];
            
            // Override material with instance material if needed
            var localVoxel = voxel;
            if (instance.materialIdx != 0xFFFFFFFFu) { // Check if instance has override material
                localVoxel.materialIdx = instance.materialIdx;
            }
            
            let voxelHit = intersectVoxel(objectRay, localVoxel);
            
            if (voxelHit.hit && voxelHit.t < hitInfo.t) {
                hitInfo = voxelHit;
                
                // Transform hit position and normal to world space
                hitInfo.position = (instance.transform * vec4f(hitInfo.position, 1.0)).xyz;
                hitInfo.normal = normalize((instance.transform * vec4f(hitInfo.normal, 0.0)).xyz);
            }
        } else {
            // Internal node - traverse children
            let childCount = getChildCount(flags);
            let firstChildIdx = currentNode.firstChildOrVoxelIndex;
            
            // Push children to stack (back to front)
            for (var i = 0u; i < childCount; i++) {
                let childNodeIdx = firstChildIdx + i;
                stack[stackPtr] = childNodeIdx;
                stackPtr += 1u;
            }
        }
    }
    
    return hitInfo;
}

// Trace a ray through the TLAS
fn traceTLAS(ray: Ray) -> HitInfo {
    var hitInfo: HitInfo;
    hitInfo.hit = false;
    hitInfo.t = MAX_DISTANCE;
    
    // Initialize traversal stack
    var stack: array<u32, MAX_STACK_SIZE>;
    var stackPtr = 0u;
    stack[stackPtr] = 0u; // Start with root node
    stackPtr += 1u;
    
    while (stackPtr > 0u) {
        stackPtr -= 1u;
        let currentNodeIdx = stack[stackPtr];
        let currentNode = tlasNodes[currentNodeIdx];
        
        // Check if ray intersects node AABB
        let t = intersectAABB(ray, currentNode.aabbMin, currentNode.aabbMax);
        if (t < 0.0 || t > hitInfo.t) {
            continue; // Skip if no intersection or beyond closest hit
        }
        
        // Check if this is a leaf node
        if (currentNode.left == 0u && currentNode.right == 0u) {
            // Leaf node - trace BLAS
            let instanceIdx = currentNode.blasInstanceIndex;
            if (instanceIdx != 0xFFFFFFFFu) { // Valid instance
                let instance = blasInstances[instanceIdx];
                let blasRootIdx = instance.blasOffset;
                
                let localHit = traceBLAS(ray, instance, blasRootIdx);
                if (localHit.hit && localHit.t < hitInfo.t) {
                    hitInfo = localHit;
                }
            }
        } else {
            // Internal node - traverse children
            if (currentNode.left != 0u) {
                stack[stackPtr] = currentNode.left;
                stackPtr += 1u;
            }
            
            if (currentNode.right != 0u) {
                stack[stackPtr] = currentNode.right;
                stackPtr += 1u;
            }
        }
    }
    
    return hitInfo;
}