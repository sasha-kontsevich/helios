import { IPlugin } from '../index';
import { Context } from './index';

export class PluginManager {
    private readonly context: Context;
    private readonly plugins = new Map<string, IPlugin>();

    constructor(context: Context) {
        this.context = context;
    }

    register(plugin: IPlugin) {
        if (this.plugins.has(plugin.name)) {
            throw new Error(`Plugin with name "${plugin.name}" is already registered.`);
        }

        plugin.setup(this.context);
        this.plugins.set(plugin.name, plugin);
    }

    async initAll() {
        for (const plugin of this.plugins.values()) {
            if (plugin.init) {
                await plugin.init(this.context);
            }
        }
    }

    get(name: string): IPlugin | undefined {
        return this.plugins.get(name);
    }
}
