import type { ComponentInspectorExtension } from "./inspectorTypes";

export class EditorInspectorRegistry {
    private readonly extensions: ComponentInspectorExtension[] = [];

    register(extension: ComponentInspectorExtension): void {
        this.extensions.push(extension);
    }

    registerAll(extensions: readonly ComponentInspectorExtension[]): void {
        for (const e of extensions) this.extensions.push(e);
    }

    /**
     * Returns the highest-priority extension that lists `componentName`, or null for generic UI.
     */
    resolve(componentName: string): ComponentInspectorExtension | null {
        let best: ComponentInspectorExtension | null = null;
        let bestP = -Infinity;
        for (const ext of this.extensions) {
            if (!ext.componentNames.includes(componentName)) continue;
            const p = ext.priority ?? 0;
            if (p >= bestP) {
                bestP = p;
                best = ext;
            }
        }
        return best;
    }
}
