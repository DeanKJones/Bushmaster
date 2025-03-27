type EventCallback = (event: any) => void;

export class EventSystem {
    private static instance: EventSystem;
    private listeners: Map<string, EventCallback[]> = new Map();
    
    // Keyboard state tracking
    private keyState: Map<string, boolean> = new Map();
    
    private constructor() {
        // Set up keyboard event listeners
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }
    
    public static getInstance(): EventSystem {
        if (!EventSystem.instance) {
            EventSystem.instance = new EventSystem();
        }
        return EventSystem.instance;
    }
    
    private handleKeyDown = (event: KeyboardEvent): void => {
        this.keyState.set(event.code, true);
        this.emit('keydown', event);
    };
    
    private handleKeyUp = (event: KeyboardEvent): void => {
        this.keyState.set(event.code, false);
        this.emit('keyup', event);
    };
    
    public on(eventName: string, callback: EventCallback): void {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }
        this.listeners.get(eventName)?.push(callback);
    }
    
    public off(eventName: string, callback: EventCallback): void {
        const callbacks = this.listeners.get(eventName);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    public emit(eventName: string, data: any): void {
        const callbacks = this.listeners.get(eventName);
        if (callbacks) {
            callbacks.forEach(callback => callback(data));
        }
    }
    
    public isKeyPressed(keyCode: string): boolean {
        return this.keyState.get(keyCode) === true;
    }
    
    public cleanup(): void {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    }
}