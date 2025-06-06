import { Context } from './Context';
import {ResourceManager} from "./ResourceManager";
import {ComponentManager} from "./ComponentManager";

export abstract class System {
    protected enabled: boolean = true;
    protected readonly world;
    protected readonly resources: ResourceManager;
    protected readonly components: ComponentManager;

    constructor(context: Context) {
        const { ecsWorld, resources } = context;
        this.world = ecsWorld;
        this.resources = resources;
        this.components = context.components;
    }

    /**
     * Called when the system is registered and the engine is starting
     */
    async start(): Promise<void> {}

    /**
     * Called every frame with the time delta
     */
    abstract update(deltaTime: number): void;

    /**
     * Called when the system is being stopped/removed
     */
    stop(): void {}

    /**
     * Enable the system
     */
    enable(): void {
        this.enabled = true;
    }

    /**
     * Disable the system
     */
    disable(): void {
        this.enabled = false;
    }

    /**
     * Check if the system is enabled
     */
    isEnabled(): boolean {
        return this.enabled;
    }
} 