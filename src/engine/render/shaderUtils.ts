
import mainSdfShader from "../shaders/main_sdf.wgsl";
import gradientShader from "../shaders/util/gradient.wgsl";

// Map of shader names to their content
const shaderMap: { [key: string]: string } = {
    "main_sdf.wgsl": mainSdfShader,
    "uvGradient.wgsl": gradientShader
};

export async function createShaderModule(device: GPUDevice, shaderName: string): Promise<GPUShaderModule> {
    // Get shader source
    const shaderSource = shaderMap[shaderName];
    if (!shaderSource) {
        throw new Error(`Shader ${shaderName} not found`);
    }
    
    // Create shader module
    return device.createShaderModule({
        code: shaderSource
    });
}