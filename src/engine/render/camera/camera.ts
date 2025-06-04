import { EventSystem } from "../../events/eventSystem";
import { Mat4 } from "../../math/mat4";

/**
 * Central Camera class that manages all camera state and notifies observers of changes
 */
export class Camera {
    // Singleton instance
    private static instance: Camera;
    
    // Event system for notifications
    private eventSystem: EventSystem;
    
    // Camera position parameters
    private position: [number, number, number] = [0, 3, 8];
    private target: [number, number, number] = [0, 0, 0];
    private up: [number, number, number] = [0, 1, 0];
    
    // Projection parameters
    private fov: number = 45 * (Math.PI / 180);
    private aspect: number = 1.0;
    private near: number = 0.1;
    private far: number = 100.0;
    
    // Matrix representations
    private viewMatrix: number[] = Mat4.identity();
    private projectionMatrix: number[] = Mat4.identity();
    private viewProjectionMatrix: number[] = Mat4.identity();
    private inverseViewProjectionMatrix: number[] = Mat4.identity();
    
    private constructor() {
        this.eventSystem = EventSystem.getInstance();
        this.updateMatrices();
    }
    
    /**
     * Get the singleton camera instance
     */
    public static getInstance(): Camera {
        if (!Camera.instance) {
            Camera.instance = new Camera();
        }
        return Camera.instance;
    }
    
    // Getters
    public getPosition(): [number, number, number] {
        return [...this.position];
    }
    
    public getTarget(): [number, number, number] {
        return [...this.target];
    }
    
    public getUp(): [number, number, number] {
        return [...this.up];
    }
    
    public getFov(): number {
        return this.fov;
    }
    
    public getAspect(): number {
        return this.aspect;
    }
    
    public getNear(): number {
        return this.near;
    }
    
    public getFar(): number {
        return this.far;
    }
    
    /**
     * Get the view matrix (world-to-camera transform)
     */
    public getViewMatrix(): number[] {
        return [...this.viewMatrix];
    }
    
    /**
     * Get the projection matrix (camera-to-clip transform)
     */
    public getProjectionMatrix(): number[] {
        return [...this.projectionMatrix];
    }
    
    /**
     * Get the combined view-projection matrix
     */
    public getViewProjectionMatrix(): number[] {
        return [...this.viewProjectionMatrix];
    }
    
    /**
     * Get the inverse of the view-projection matrix
     */
    public getInverseViewProjectionMatrix(): number[] {
        return [...this.inverseViewProjectionMatrix];
    }
    
    // Setters
    public setPosition(position: [number, number, number]): void {
        this.position = [...position];
        this.updateMatrices();
        this.notifyCameraChange();
    }
    
    public setTarget(target: [number, number, number]): void {
        this.target = [...target];
        this.updateMatrices();
        this.notifyCameraChange();
    }
    
    public setUp(up: [number, number, number]): void {
        this.up = [...up];
        this.updateMatrices();
        this.notifyCameraChange();
    }
    
    public setFov(fov: number): void {
        this.fov = fov;
        this.updateMatrices();
        this.notifyCameraChange();
    }
    
    public setAspect(aspect: number): void {
        this.aspect = aspect;
        this.updateMatrices();
        this.notifyCameraChange();
    }
    
    public setNear(near: number): void {
        this.near = near;
        this.updateMatrices();
        this.notifyCameraChange();
    }
    
    public setFar(far: number): void {
        this.far = far;
        this.updateMatrices();
        this.notifyCameraChange();
    }
    
    /**
     * Update camera position and orientation
     */
    public updateCamera(
        position: [number, number, number],
        target: [number, number, number],
        up: [number, number, number] = [0, 1, 0]
    ): void {
        this.position = [...position];
        this.target = [...target];
        this.up = [...up];
        this.updateMatrices();
        this.notifyCameraChange();
    }
    
    /**
     * Update all matrix representations when camera parameters change
     */
    private updateMatrices(): void {
        // Update view matrix (using lookAt)
        this.viewMatrix = Mat4.lookAt(this.position, this.target, this.up);
        
        // Update projection matrix (using perspective)
        this.projectionMatrix = Mat4.perspective(this.fov, this.aspect, this.near, this.far);
        
        // Update combined view-projection matrix
        this.viewProjectionMatrix = Mat4.multiply(this.projectionMatrix, this.viewMatrix);
        
        // Update inverse view-projection matrix
        this.inverseViewProjectionMatrix = Mat4.inverse(this.viewProjectionMatrix);
    }
    
    /**
     * Emit event to notify all listeners about camera changes
     */
    private notifyCameraChange(): void {
        console.log('Camera: Emitting camera change event', this.position);
        
        const cameraData = {
            position: this.position,
            target: this.target,
            up: this.up,
            fov: this.fov,
            aspect: this.aspect,
            near: this.near,
            far: this.far,
            viewMatrix: this.viewMatrix,
            projectionMatrix: this.projectionMatrix,
            viewProjectionMatrix: this.viewProjectionMatrix,
            inverseViewProjectionMatrix: this.inverseViewProjectionMatrix
        };
        
        this.eventSystem.emit('camera.changed', cameraData);
    }
}