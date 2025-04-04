
//import { EventSystem } from "./eventSystem";

export class CameraController {
    //private eventSystem: EventSystem;
    private camera: {
        position: [number, number, number];
        target: [number, number, number];
        up: [number, number, number];
    };
    
    private isDragging: boolean = false;
    private lastMouseX: number = 0;
    private lastMouseY: number = 0;
    private orbitDistance: number = 8.0;
    private orbitTheta: number = Math.PI / 4; // Horizontal angle
    private orbitPhi: number = Math.PI / 4;   // Vertical angle
    
    constructor(camera: any) {
        this.camera = camera;
        //this.eventSystem = EventSystem.getInstance();
        this.setupEvents();
        this.updateCameraPosition();
    }
    
    private setupEvents() {
        document.addEventListener('mousedown', this.onMouseDown);
        document.addEventListener('mouseup', this.onMouseUp);
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('wheel', this.onWheel);
    }
    
    private onMouseDown = (e: MouseEvent) => {
        this.isDragging = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    };
    
    private onMouseUp = () => {
        this.isDragging = false;
    };
    
    private onMouseMove = (e: MouseEvent) => {
        if (!this.isDragging) return;
        
        const deltaX = e.clientX - this.lastMouseX;
        const deltaY = e.clientY - this.lastMouseY;
        
        this.orbitTheta -= deltaX * 0.01;
        this.orbitPhi = Math.max(0.1, Math.min(Math.PI - 0.1, this.orbitPhi - deltaY * 0.01));
        
        this.updateCameraPosition();
        
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    };
    
    private onWheel = (e: WheelEvent) => {
        this.orbitDistance = Math.max(2.0, Math.min(20.0, this.orbitDistance + e.deltaY * 0.01));
        this.updateCameraPosition();
    };
    
    private updateCameraPosition() {
        // Convert spherical to Cartesian coordinates
        this.camera.position = [
            this.orbitDistance * Math.sin(this.orbitPhi) * Math.sin(this.orbitTheta),
            this.orbitDistance * Math.cos(this.orbitPhi),
            this.orbitDistance * Math.sin(this.orbitPhi) * Math.cos(this.orbitTheta)
        ];
        
        // Always look at the origin
        this.camera.target = [0, 0, 0];
    }
    
    public cleanup() {
        document.removeEventListener('mousedown', this.onMouseDown);
        document.removeEventListener('mouseup', this.onMouseUp);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('wheel', this.onWheel);
    }
}