import { Context } from './index';
import { System } from './System';
import { SystemConstructor } from '../types';

export class SystemManager {
    private systems: System[] = [];
    private systemMap = new Map<string, System>();

    constructor(private readonly context: Context) {}

    register(systems: (SystemConstructor | System)[]) {
        for (const s of systems) {
            const instance = typeof s === 'function' ? new s(this.context) : s;
            const systemName = instance.constructor.name;
            
            if (this.systemMap.has(systemName)) {
                throw new Error(`System "${systemName}" is already registered`);
            }

            this.systems.push(instance);
            this.systemMap.set(systemName, instance);
        }
    }

    async startAll(): Promise<void> {
        for (const system of this.systems) {
            if (system.isEnabled()) {
                await system.start();
            }
        }
    }

    update(deltaTime: number): void {
        for (const system of this.systems) {
            if (system.isEnabled()) {
                system.update(deltaTime);
            }
        }
    }

    stopAll() {
        for (const system of this.systems) {
            if (system.isEnabled()) {
                system.stop();
            }
        }
    }

    get(name: string): System | undefined {
        return this.systemMap.get(name);
    }

    enable(name: string) {
        const system = this.systemMap.get(name);
        if (system) {
            system.enable();
        }
    }

    disable(name: string) {
        const system = this.systemMap.get(name);
        if (system) {
            system.disable();
        }
    }

    clear(): void {
        this.systems = [];
        this.systemMap.clear();
    }
}
