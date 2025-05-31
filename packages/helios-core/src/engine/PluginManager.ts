import { Plugin } from '../index';
import { Context } from './index';

export class PluginManager {
    private readonly context: Context;
    private readonly plugins = new Map<string, Plugin>();

    constructor(context: Context) {
        this.context = context;
    }

    registerAll(plugins: Plugin[]) {
        plugins.forEach(plugin => {
            this.register(plugin);
        })
    }

    register(plugin: Plugin) {
        if (this.plugins.has(plugin.name)) {
            throw new Error(`Plugin with name "${plugin.name}" is already registered.`);
        }

        plugin.setup();
        this.plugins.set(plugin.name, plugin);
    }

    async initAll() {
        for (const plugin of this.plugins.values()) {
            if (plugin.init) {
                plugin.init();
            }
        }
    }

    get(name: string): Plugin | undefined {
        return this.plugins.get(name);
    }
}
