// Vertex shader
struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) nearPos: vec3f,
    @location(1) farPos: vec3f,
    @location(2) camPos: vec3f,
};

struct CameraUniform {
    viewProj: mat4x4f,
    invViewProj: mat4x4f,
    position: vec3f,
    padding1: f32,
    nearPlane: f32,
    farPlane: f32,
    padding2: vec2f,
};

@group(0) @binding(0) var<uniform> camera: CameraUniform;

@vertex
fn vertMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    var output: VertexOutput;
    
    // Full-screen quad vertices
    var positions = array<vec2f, 4>(
        vec2f(-1.0, -1.0),
        vec2f(-1.0, 1.0),
        vec2f(1.0, -1.0),
        vec2f(1.0, 1.0)
    );
    
    var pos = positions[vertexIndex];
    
    // Clip to world space conversion
    output.nearPos = clipToWorldSpace(vec3f(pos, 0.0));
    output.farPos = clipToWorldSpace(vec3f(pos, 1.0));
    output.camPos = camera.position;
    output.position = vec4f(pos, 0.0, 1.0);
    
    return output;
}

// Function to convert clip space to world space
fn clipToWorldSpace(clipPos: vec3f) -> vec3f {
    var pos = camera.invViewProj * vec4f(clipPos, 1.0);
    return pos.xyz / pos.w;
}

// Fragment shader
@fragment
fn fragMain(input: VertexOutput) -> @location(0) vec4f {
    // Calculate world position at grid plane (y=0)
    let t = -input.nearPos.y / (input.farPos.y - input.nearPos.y);
    let worldPos = input.nearPos + t * (input.farPos - input.nearPos);
    
    // Grid rendering
    let mainGrid = grid(worldPos, vec4f(0.2, 0.2, 0.2, 0.75), 1.0, true);
    let fineGrid = grid(worldPos, vec4f(0.1, 0.1, 0.1, 0.5), 5.0, false);
    
    // Make fine grid visible only when camera is close
    let camCloseThreshold = 15.0;
    var camDist = distance(input.camPos, worldPos);
    camDist = min(camDist, camCloseThreshold);
    camDist = camDist / camCloseThreshold;
    let fineGridAlpha = mix(fineGrid.a, 0.0, camDist);
    
    // Mix grids
    var color = mainGrid.rgb + fineGrid.rgb;
    var alpha = max(mainGrid.a, fineGridAlpha);
    
    // Fade grid by distance
    alpha *= max(0.0, (0.5 - getLinearDepth(worldPos, 1.0)));
    
    // Only render grid where t > 0 (meaning we intersect with the plane)
    return vec4f(color, alpha) * f32(t > 0.0);
}

// Grid function
fn grid(pos: vec3f, lineColor: vec4f, scale: f32, drawAxis: bool) -> vec4f {
    let coord = pos.xz * scale;
    let derivative = fwidth(coord) * 1.5; // For anti-aliasing
    let grid = abs(fract(coord - 0.5) - 0.5) / derivative;
    let line = min(grid.x, grid.y);
    let minimumz = min(derivative.y, 1.0);
    let minimumx = min(derivative.x, 1.0);
    
    var color = vec4f(lineColor.rgb, lineColor.a - min(line, 1.0));
    
    if (drawAxis) {
        // Z axis (blue)
        if (pos.x > -minimumx && pos.x < minimumx) {
            color = vec4f(0.0, 0.0, 1.0, 1.0);
        }
        // X axis (red)
        if (pos.z > -minimumz && pos.z < minimumz) {
            color = vec4f(1.0, 0.0, 0.0, 1.0);
        }
    }
    
    return color;
}

// Calculate linear depth for fading
fn getLinearDepth(pos: vec3f, fallOff: f32) -> f32 {
    let near = camera.nearPlane;
    let far = camera.farPlane / fallOff;
    let clipPos = camera.viewProj * vec4f(pos, 1.0);
    var depth = clamp((clipPos.z / clipPos.w) * 2.0 - 1.0, -1.0, 1.0);
    depth = (2.0 * near * far) / (far + near - depth * (far - near));
    return depth / far;
}