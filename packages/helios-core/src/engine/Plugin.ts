import { Context } from './Context';
import type { HeliosPlugin } from '../types/HeliosPlugin';
import { SUPPORTED_HELIOS_PLUGIN_API } from '../types/HeliosPlugin';

export class Plugin implements HeliosPlugin {
    public readonly id: string = 'plugin';
    /**
     * @deprecated Use {@link id}; kept for backward compatibility with older examples.
     */
    public get name(): string {
        return this.id;
    }

    public readonly version: string = '0.0.0';
    public readonly enginePluginApi: string = SUPPORTED_HELIOS_PLUGIN_API;
    public readonly requires: HeliosPlugin['requires'] = undefined;
    public readonly provides: HeliosPlugin['provides'] = undefined;

    private context!: Context;

    protected constructor() {}

    public setup(context: Context): void | Promise<void> {
        this.context = context;
    }

    protected getContext(): Context {
        return this.context;
    }

    public dispose(): void {}
}
