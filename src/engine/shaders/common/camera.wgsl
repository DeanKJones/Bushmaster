struct Camera {
    viewProjMatrix: mat4x4<f32>,
    inverseViewProjMatrix: mat4x4<f32>,
    position: vec3<f32>,
    nearFar: vec2<f32>,
};