import { Context } from './index';
import { System } from './System';
import { SystemConstructor } from '../types';
import type { SystemRuntimeSnapshot } from '../types/SystemRuntimeSnapshot';
import { EDITOR_PLAY_SESSION_CAPABILITY } from '../types/EditorPlaySessionCapability';

function readRunsInEditor(system: System): boolean {
    const ctor = system.constructor as typeof System & { runsInEditor?: boolean };
    return ctor.runsInEditor === true;
}

export class SystemManager {
    private systems: System[] = [];
    private systemMap = new Map<string, System>();
    private readonly started = new Set<System>();

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
        await this.startSystems(this.systems);
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
        this.started.clear();
    }

    /** Full `stop` then `start` on all enabled systems (standalone / engine shutdown paths). */
    async restartAll(): Promise<void> {
        this.stopAll();
        await this.startAll();
    }

    /**
     * Editor host: disable simulation systems until Enter Play.
     * No-op when `EDITOR_PLAY_SESSION_CAPABILITY` is not registered.
     */
    applyEditorHostPolicy(): void {
        if (!this.isEditorPlayHost()) {
            return;
        }
        for (const system of this.simulationSystems()) {
            system.disable();
        }
    }

    /** Enter Play: enable and start simulation layer. */
    async beginPlaySessionSystems(): Promise<void> {
        for (const system of this.simulationSystems()) {
            system.enable();
        }
        await this.startSystems(this.simulationSystems());
    }

    /** Exit Play: stop and disable simulation layer. */
    async endPlaySessionSystems(): Promise<void> {
        this.stopSystems(this.simulationSystems());
        for (const system of this.simulationSystems()) {
            system.disable();
        }
    }

    /** After world snapshot apply: restart editor presentation systems only. */
    async restartEditorPresentationSystems(): Promise<void> {
        await this.restartSystems(this.editorSystems());
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

    /**
     * Enable or disable one system; runs `start` when enabling (if not started) and `stop` when disabling.
     */
    async setSystemEnabled(name: string, enabled: boolean): Promise<void> {
        const system = this.systemMap.get(name);
        if (!system) {
            throw new Error(`[SystemManager] System "${name}" is not registered.`);
        }
        if (enabled) {
            if (!system.isEnabled()) {
                system.enable();
            }
            await this.startSystems([system]);
            return;
        }
        if (system.isEnabled()) {
            this.stopSystems([system]);
            system.disable();
        }
    }

    clear(): void {
        this.systems = [];
        this.systemMap.clear();
        this.started.clear();
    }

    listRuntimeSnapshots(): SystemRuntimeSnapshot[] {
        return this.systems.map((system, order) => {
            const runsInEditor = readRunsInEditor(system);
            const enabled = system.isEnabled();
            return {
                name: system.constructor.name,
                order,
                enabled,
                started: this.started.has(system),
                runsInEditor,
                updateActive: enabled,
            };
        });
    }

    private isEditorPlayHost(): boolean {
        return this.context.capabilities.has(EDITOR_PLAY_SESSION_CAPABILITY);
    }

    private editorSystems(): System[] {
        return this.systems.filter((s) => readRunsInEditor(s));
    }

    private simulationSystems(): System[] {
        return this.systems.filter((s) => !readRunsInEditor(s));
    }

    private stopSystems(systems: System[]): void {
        for (const system of systems) {
            if (system.isEnabled()) {
                system.stop();
            }
            this.started.delete(system);
        }
    }

    private async startSystems(systems: System[]): Promise<void> {
        for (const system of systems) {
            if (!system.isEnabled() || this.started.has(system)) {
                continue;
            }
            await system.start();
            this.started.add(system);
        }
    }

    private async restartSystems(systems: System[]): Promise<void> {
        this.stopSystems(systems);
        await this.startSystems(systems);
    }
}
