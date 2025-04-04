#include "../bvh/bvhTraverse.wgsl"

// Simple lighting calculation for a single direct bounce
fn calculateDirectLighting(hitInfo: HitInfo) -> vec3f {
    // If material is emissive, return emission directly
    let material = materials[hitInfo.material];
    if (material.emissionStrength > 0.0) {
        return material.emission * material.emissionStrength;
    }
    
    // Simple ambient term
    let ambient = vec3f(0.1);
    
    // Simple directional light
    let lightDir = normalize(vec3f(1.0, 1.0, 1.0));
    let diffuse = max(dot(hitInfo.normal, lightDir), 0.0);
    
    // Shadow test
    var shadowRay: Ray;
    shadowRay.origin = hitInfo.position + hitInfo.normal * EPSILON;
    shadowRay.direction = lightDir;
    
    let shadowHit = traceTLAS(shadowRay);
    let inShadow = shadowHit.hit;
    
    // Calculate light intensity (1.0 if lit, 0.0 if in shadow)
    let lightIntensity = select(1.0, 0.0, inShadow);
    
    // Calculate direct lighting contribution
    let lighting = ambient + diffuse * lightIntensity;
    
    return material.color * lighting;
}
