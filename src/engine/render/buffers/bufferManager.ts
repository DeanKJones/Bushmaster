
import { ScreenBufferDescription } from "./screenBufferDescription";

export class BufferManager {
    device: GPUDevice;
    canvas: HTMLCanvasElement;

    screenBuffers!: ScreenBufferDescription;

    constructor(device: GPUDevice, canvas: HTMLCanvasElement) {
        this.device = device;
        this.canvas = canvas;

        this.screenBuffers = new ScreenBufferDescription(this.device, this.canvas);
    }
}