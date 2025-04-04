// Constants
const PI = 3.14159265359;
const EPSILON = 0.0001;
const MAX_DISTANCE = 1000.0;
const MAX_BOUNCES = 4;
const MAX_STACK_SIZE = 32;

// Camera and view parameters
struct CameraData {
    position: vec3f,
    viewTarget: vec3f,
    up: vec3f,
    fov: f32,
    aspect: f32,
}

// Ray definition
struct Ray {
    origin: vec3f,
    direction: vec3f,
}

// Hit information
struct HitInfo {
    t: f32,             // Distance
    position: vec3f,    // Hit position
    normal: vec3f,      // Surface normal
    material: u32,      // Material index
    hit: bool,          // Whether anything was hit
}

// BLAS Node structure
struct BLASNode {
    aabbMin: vec3f,
    flags: u32,         // isLeaf(1) | childCount(7) | lodLevel(8) | occupancyMask(8) | padding(8)
    aabbMax: vec3f,
    firstChildOrVoxelIndex: u32,
}

// TLAS Node structure
struct TLASNode {
    aabbMin: vec3f,
    left: u32,
    aabbMax: vec3f,
    right: u32,
    blasInstanceIndex: u32,
    padding: vec3u,
}

// BLAS Instance structure
struct BLASInstance {
    transform: mat4x4f,
    transformInverse: mat4x4f,
    blasOffset: u32,
    materialIdx: u32,
    padding: vec2u,
}

// Voxel data structure
struct Voxel {
    position: vec3f,
    materialIdx: u32,
    size: f32,
    occupancyMask: u32,
    lodLevel: u32,
    padding: u32,
}

// Material structure
struct Material {
    color: vec3f,
    roughness: f32,
    emission: vec3f,
    emissionStrength: f32,
    metalness: f32,
    padding: vec3f,
}


// Bind groups
@group(0) @binding(0) var<uniform> camera: CameraData;
@group(0) @binding(1) var<storage, read> voxels: array<Voxel>;
@group(0) @binding(2) var<storage, read> blasNodes: array<BLASNode>;
@group(0) @binding(3) var<storage, read> tlasNodes: array<TLASNode>;
@group(0) @binding(4) var<storage, read> blasInstances: array<BLASInstance>;
@group(0) @binding(5) var<storage, read> materials: array<Material>;
@group(0) @binding(6) var outputTexture: texture_storage_2d<rgba8unorm, write>;


// Helper functions
fn isLeafNode(flags: u32) -> bool {
    return (flags & 1u) != 0u;
}

fn getChildCount(flags: u32) -> u32 {
    return (flags >> 1u) & 0x7Fu; // 7 bits
}

fn getLodLevel(flags: u32) -> u32 {
    return (flags >> 8u) & 0xFFu; // 8 bits
}

fn getOccupancyMask(flags: u32) -> u32 {
    return (flags >> 16u) & 0xFFu; // 8 bits
}