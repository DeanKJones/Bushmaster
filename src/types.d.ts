declare module '*.wgsl' {
    const shader: 'string';
    export default shader;
  }

  interface GPUAdapterInfo {
    vendor: string;
    architecture: string;
    device: string;
    description: string;
}

interface GPUAdapter {
    requestAdapterInfo(): Promise<GPUAdapterInfo>;
}