
export class ScreenBufferDescription {

    device: GPUDevice;
    canvas: HTMLCanvasElement;
    colorBuffer!: GPUTexture;
    colorBufferView!: GPUTextureView;
    sampler!: GPUSampler;

    constructor(device: GPUDevice, canvas: HTMLCanvasElement) {
        this.device = device;
        this.canvas = canvas;

        this.colorBuffer = this.device.createTexture(
            {
                size: {     // uuuh supersample?
                    width: this.canvas.width * 4, 
                    height: this.canvas.height * 4,
                },
                format: "rgba8unorm",
                usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING
            }
        );

        this.colorBufferView = this.colorBuffer.createView();

        const samplerDescriptor: GPUSamplerDescriptor = {
            addressModeU: "repeat",
            addressModeV: "repeat",
            magFilter: "linear",
            minFilter: "nearest",
            mipmapFilter: "nearest",
            maxAnisotropy: 1
        };
        this.sampler = this.device.createSampler(samplerDescriptor);
    }

}