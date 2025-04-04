

// Ray-AABB intersection test
fn intersectAABB(ray: Ray, boxMin: vec3f, boxMax: vec3f) -> f32 {
    // Compute inverses of ray direction
    let invD = 1.0 / ray.direction;
    
    // Calculate intersections with planes
    let t1 = (boxMin - ray.origin) * invD;
    let t2 = (boxMax - ray.origin) * invD;
    
    // Get min/max intersection points
    let tMin = min(t1, t2);
    let tMax = max(t1, t2);
    
    // Find the largest tMin and smallest tMax
    let t_min = max(max(tMin.x, tMin.y), tMin.z);
    let t_max = min(min(tMax.x, tMax.y), tMax.z);
    
    // Check if there's a valid intersection
    if (t_max < 0.0 || t_min > t_max) {
        return -1.0; // No intersection
    }
    
    return t_min;
}
