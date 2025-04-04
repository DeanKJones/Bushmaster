struct Ray {
    origin: vec3<f32>,
    direction: vec3<f32>,
};

struct SurfaceHit {
    position: vec3<f32>,
    normal: vec3<f32>,
    distance: f32,
    materialId: u32,
};