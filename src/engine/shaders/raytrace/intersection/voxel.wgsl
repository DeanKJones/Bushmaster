
// Ray-voxel intersection test
fn intersectVoxel(ray: Ray, voxel: Voxel) -> HitInfo {
    var hitInfo: HitInfo;
    hitInfo.hit = false;
    hitInfo.t = MAX_DISTANCE;
    
    // Calculate AABB for the voxel
    let halfSize = voxel.size * 0.5;
    let boxMin = voxel.position - vec3f(halfSize);
    let boxMax = voxel.position + vec3f(halfSize);
    
    // Check intersection with AABB
    let t = intersectAABB(ray, boxMin, boxMax);
    
    if (t > 0.0 && t < hitInfo.t) {
        // Calculate hit position
        let hitPos = ray.origin + ray.direction * t;
        
        // Calculate normal based on which face was hit
        var normal = vec3f(0.0);
        let center = voxel.position;
        
        // Find the closest face by checking distance to each plane
        let distToFace = abs(hitPos - center);
        let maxDist = max(max(distToFace.x, distToFace.y), distToFace.z);
        
        if (abs(distToFace.x - maxDist) < EPSILON) {
            normal.x = sign(hitPos.x - center.x);
        } else if (abs(distToFace.y - maxDist) < EPSILON) {
            normal.y = sign(hitPos.y - center.y);
        } else if (abs(distToFace.z - maxDist) < EPSILON) {
            normal.z = sign(hitPos.z - center.z);
        }
        
        // Fill hit info
        hitInfo.hit = true;
        hitInfo.t = t;
        hitInfo.position = hitPos;
        hitInfo.normal = normal;
        hitInfo.material = voxel.materialIdx;
    }
    
    return hitInfo;
}