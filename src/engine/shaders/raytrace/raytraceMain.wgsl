// Voxel raytrace kernel
#include "./lighting/directLighting.wgsl"

// Create a camera ray based on pixel coordinates
fn createCameraRay(pixel: vec2f, screenSize: vec2f) -> Ray {
    // Normalize coordinates to [-1, 1]
    let ndc = vec2f(
        (pixel.x / screenSize.x) * 2.0 - 1.0,
        1.0 - (pixel.y / screenSize.y) * 2.0
    );
    
    // Calculate camera basis vectors
    let forward = normalize(camera.viewTarget - camera.position);
    let right = normalize(cross(forward, camera.up));
    let up = cross(right, forward);
    
    // Calculate ray direction
    let halfFov = tan(camera.fov * 0.5);
    let rayDir = normalize(
        forward + 
        right * ndc.x * halfFov * camera.aspect + 
        up * ndc.y * halfFov
    );
    
    return Ray(camera.position, rayDir);
}

// Apply tone mapping and gamma correction
fn toneMap(color: vec3f) -> vec3f {
    // Simple ACES-like tonemapping function
    let a = 2.51;
    let b = 0.03;
    let c = 2.43;
    let d = 0.59;
    let e = 0.14;
    let mapped = (color * (a * color + b)) / (color * (c * color + d) + e);
    
    // Gamma correction
    return pow(saturate(mapped), vec3f(1.0/2.2));
}

// Main compute shader entry
@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) global_id: vec3u) {
    // Get texture dimensions
    let dimensions = textureDimensions(outputTexture);
    
    // Check if we're in bounds
    if (global_id.x >= dimensions.x || global_id.y >= dimensions.y) {
        return;
    }
    
    // Create pixel coordinates for anti-aliasing
    let pixelCenter = vec2f(global_id.xy) + vec2f(0.5);
    
    // Create a ray from the camera through this pixel
    let primaryRay = createCameraRay(pixelCenter, vec2f(dimensions));
    
    // Trace the primary ray
    var hitInfo = traceTLAS(primaryRay);
    
    // If nothing was hit, return sky color
    if (!hitInfo.hit) {
        let skyColor = vec3f(0.1, 0.15, 0.4); // Sky color
        textureStore(outputTexture, global_id.xy, vec4f(skyColor, 1.0));
        return;
    }
    
    // Get material at hit point
    let material = materials[hitInfo.material];
    
    // If material is emissive, return emission directly
    if (material.emissionStrength > 0.0) {
        let emissiveColor = material.emission * material.emissionStrength;
        textureStore(outputTexture, global_id.xy, vec4f(toneMap(emissiveColor), 1.0));
        return;
    }
    
    // Start with direct lighting contribution
    var totalColor = calculateDirectLighting(hitInfo);
    
    // Add reflection (if material is metallic)
    if (material.metalness > 0.0) {
        let maxBounces = 2u; // Limit recursion depth
        
        var currentRay = primaryRay;
        var currentHit = hitInfo;
        var currentMaterial = material;
        var reflectColor = vec3f(1.0);
        var reflectContribution = vec3f(0.0);
        
        for (var bounce = 0u; bounce < maxBounces; bounce++) {
            // Calculate reflection direction
            let reflectDir = reflect(currentRay.direction, currentHit.normal);
            
            // Create reflection ray
            var reflectRay: Ray;
            reflectRay.origin = currentHit.position + currentHit.normal * EPSILON;
            reflectRay.direction = reflectDir;
            
            // Trace reflection ray
            let reflectHit = traceTLAS(reflectRay);
            
            // If nothing hit, add sky contribution and break
            if (!reflectHit.hit) {
                reflectContribution += reflectColor * vec3f(0.1, 0.15, 0.2);
                break;
            }
            
            // Get material at reflection hit point
            let reflectMaterial = materials[reflectHit.material];
            
            // If hit emissive material, add emission and break
            if (reflectMaterial.emissionStrength > 0.0) {
                reflectContribution += reflectColor * reflectMaterial.emission * reflectMaterial.emissionStrength;
                break;
            }
            
            // Add direct lighting contribution at reflection point
            reflectContribution += reflectColor * calculateDirectLighting(reflectHit);
            
            // Update for next bounce (if material is metallic)
            reflectColor *= reflectMaterial.color * reflectMaterial.metalness;
            currentRay = reflectRay;
            currentHit = reflectHit;
            currentMaterial = reflectMaterial;
            
            // Early exit if reflection diminishes
            if (length(reflectColor) < 0.01) {
                break;
            }
        }
        
        // Mix direct lighting with reflection based on metalness
        totalColor = mix(totalColor, reflectContribution, material.metalness);
    }
    
    // Apply tone mapping and write final color
    textureStore(outputTexture, global_id.xy, vec4f(toneMap(totalColor), 1.0));
}