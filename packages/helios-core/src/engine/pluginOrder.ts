import type { HeliosPlugin } from '../types/HeliosPlugin';

/**
 * Topologically sort plugins so every {@link HeliosPlugin.requires} edge is satisfied.
 * Tie-break by original config order for stable, deterministic ordering.
 */
export function sortPluginsForRegistration(plugins: HeliosPlugin[]): HeliosPlugin[] {
    const byId = new Map<string, HeliosPlugin>();
    const indexById = new Map<string, number>();

    plugins.forEach((p, i) => {
        if (byId.has(p.id)) {
            throw new Error(`[PluginManager] Duplicate plugin id "${p.id}".`);
        }
        byId.set(p.id, p);
        indexById.set(p.id, i);
    });

    const capabilityProvider = new Map<string, string>();
    for (const p of plugins) {
        for (const cap of p.provides ?? []) {
            const existing = capabilityProvider.get(cap);
            if (existing && existing !== p.id) {
                throw new Error(
                    `[PluginManager] Capability "${cap}" is provided by multiple plugins: "${existing}" and "${p.id}".`,
                );
            }
            capabilityProvider.set(cap, p.id);
        }
    }

    const adj = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    for (const id of byId.keys()) {
        adj.set(id, []);
        inDegree.set(id, 0);
    }

    for (const p of plugins) {
        for (const dep of p.requires ?? []) {
            let sourceId: string;
            if ('pluginId' in dep) {
                sourceId = dep.pluginId;
            } else {
                const prov = capabilityProvider.get(dep.capability);
                if (prov === undefined) {
                    throw new Error(
                        `[PluginManager] Plugin "${p.id}" requires capability "${dep.capability}" ` +
                            `but no plugin in this config lists it in provides.`,
                    );
                }
                sourceId = prov;
            }

            if (!byId.has(sourceId)) {
                throw new Error(
                    `[PluginManager] Plugin "${p.id}" depends on plugin "${sourceId}" which is not in the plugin list.`,
                );
            }

            if (sourceId === p.id) {
                throw new Error(`[PluginManager] Plugin "${p.id}" cannot depend on itself.`);
            }

            adj.get(sourceId)!.push(p.id);
            inDegree.set(p.id, (inDegree.get(p.id) ?? 0) + 1);
        }
    }

    const result: HeliosPlugin[] = [];
    const placed = new Set<string>();
    const n = plugins.length;

    while (placed.size < n) {
        const ready = [...byId.keys()]
            .filter((id) => !placed.has(id) && (inDegree.get(id) ?? 0) === 0)
            .sort((a, b) => indexById.get(a)! - indexById.get(b)!);

        if (ready.length === 0) {
            throw new Error('[PluginManager] Plugin dependency cycle detected or unsatisfiable requires.');
        }

        for (const id of ready) {
            placed.add(id);
            result.push(byId.get(id)!);

            for (const next of adj.get(id) ?? []) {
                inDegree.set(next, inDegree.get(next)! - 1);
            }
        }
    }

    return result;
}
