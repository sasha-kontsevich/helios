import type { HeliosPlugin } from '../types/HeliosPlugin';
import { assertPluginApiCompatible } from '../types/HeliosPlugin';
import { Context } from './Context';
import { sortPluginsForRegistration } from './pluginOrder';

export class PluginManager {
    private readonly context: Context;
    private readonly plugins = new Map<string, HeliosPlugin>();
    /** Successful registration order (used for reverse dispose). */
    private registrationOrder: HeliosPlugin[] = [];

    constructor(context: Context) {
        this.context = context;
    }

    /**
     * Sorts by dependencies, validates API version, runs setup in order.
     */
    async registerAll(plugins: HeliosPlugin[]) {
        const sorted = sortPluginsForRegistration(plugins);
        for (const plugin of sorted) {
            await this.registerOne(plugin);
        }
    }

    private async registerOne(plugin: HeliosPlugin) {
        assertPluginApiCompatible(plugin);

        if (this.plugins.has(plugin.id)) {
            throw new Error(`Plugin with id "${plugin.id}" is already registered.`);
        }

        await Promise.resolve(plugin.setup(this.context));
        this.plugins.set(plugin.id, plugin);
        this.registrationOrder.push(plugin);
    }

    /**
     * After all systems are registered; optional second phase for plugins that need the system list.
     */
    async initAll() {
        for (const plugin of this.registrationOrder) {
            await Promise.resolve(plugin.init?.(this.context));
        }
    }

    /**
     * Reverse registration order; clears plugin map and capability registry.
     */
    disposeAll() {
        for (let i = this.registrationOrder.length - 1; i >= 0; i--) {
            const plugin = this.registrationOrder[i];
            plugin.dispose?.();
        }
        this.registrationOrder = [];
        this.plugins.clear();
        this.context.capabilities.clear();
    }

    get(id: string): HeliosPlugin | undefined {
        return this.plugins.get(id);
    }
}
