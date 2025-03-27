
@group(0) @binding(0) var color_output: texture_storage_2d<rgba8unorm, write>;

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {
    let screen_size = vec2<u32>(textureDimensions(color_output));
    let screen_pos = vec2<i32>(i32(GlobalInvocationID.x), i32(GlobalInvocationID.y));
    
    // Check bounds
    if (screen_pos.x >= i32(screen_size.x) || screen_pos.y >= i32(screen_size.y)) {
        return;
    }
    
    // Simple color output based on position for testing
    let color = vec3<f32>(
        f32(screen_pos.x) / f32(screen_size.x),
        f32(screen_pos.y) / f32(screen_size.y),
        0.5
    );
    
    textureStore(color_output, screen_pos, vec4<f32>(color, 1.0));
}