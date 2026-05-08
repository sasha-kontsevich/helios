import type { Context } from '../engine/Context';

/**
 * Supported contract version between helios-core and plugins.
 * Bump when breaking plugin-facing APIs.
 */
export const SUPPORTED_HELIOS_PLUGIN_API = '1';

export type PluginDependency =
    | { readonly pluginId: string }
    | { readonly capability: string };

/**
 * Formal plugin contract: substrate / capability registration, not game logic.
 */
export interface HeliosPlugin {
    /** Stable unique id (registry key, dependency target). */
    readonly id: string;
    /** Implementation semver of this plugin package. */
    readonly version: string;
    /** Contract version this plugin targets; must match {@link SUPPORTED_HELIOS_PLUGIN_API}. */
    readonly enginePluginApi: string;
    /** Declared dependencies before {@link setup} runs. */
    readonly requires?: PluginDependency[];
    /** Capability keys this plugin will register on {@link Context.capabilities} during setup. */
    readonly provides?: readonly string[];

    setup(context: Context): void | Promise<void>;
    init?(context: Context): void | Promise<void>;
    dispose?(): void;
}

export function assertPluginApiCompatible(plugin: Pick<HeliosPlugin, 'id' | 'enginePluginApi'>): void {
    if (plugin.enginePluginApi !== SUPPORTED_HELIOS_PLUGIN_API) {
        throw new Error(
            `[PluginManager] Plugin "${plugin.id}" targets enginePluginApi "${plugin.enginePluginApi}" ` +
                `but this engine supports only "${SUPPORTED_HELIOS_PLUGIN_API}".`,
        );
    }
}
