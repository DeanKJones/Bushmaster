/**
 * Stores and manages rendering context information for UI display
 */
export class RenderContext {
    // Performance metrics
    private frameCount: number = 0;
    private deltaTime: number = 0;
    private fps: number = 0;
    private fpsUpdateInterval: number = 0.5; // Update FPS every 0.5 seconds
    private fpsAccumulator: number = 0;
    private frameAccumulator: number = 0;
    
    
    /**
     * Update the render context with new frame information
     */
    public update(deltaTime: number): void {
        this.deltaTime = deltaTime;
        this.frameCount++;
        
        // Calculate FPS
        this.frameAccumulator++;
        this.fpsAccumulator += deltaTime;
        if (this.fpsAccumulator >= this.fpsUpdateInterval) {
            this.fps = this.frameAccumulator / this.fpsAccumulator;
            this.frameAccumulator = 0;
            this.fpsAccumulator = 0;
        }
    }

    public getFrameCount(): number {
        return this.frameCount;
    }

    public getDeltaTime(): number {
        return this.deltaTime;
    }

    public getFps(): number {
        return this.fps;
    }
}