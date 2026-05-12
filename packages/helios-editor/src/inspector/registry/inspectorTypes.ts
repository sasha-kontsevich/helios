import type { Component } from "vue";

/**
 * Custom Vue UI for one or more ECS component type names in the inspector.
 * Register via {@link EditorInspectorRegistry.register} or {@link createDefaultInspectorRegistry}.
 */
export interface ComponentInspectorExtension {
    /** Stable id for logging / deduplication. */
    id: string;
    /** ECS component names this view replaces when {@link rawMode} is false, or always for non-raw-capable views. */
    componentNames: readonly string[];
    /**
     * Higher wins when multiple extensions match the same `componentName` (host overrides built-in).
     * Built-ins use `0`; host extensions should use `10` or higher.
     */
    priority?: number;
    /** Vue SFC or functional component; use `markRaw` when registering object literals. */
    view: Component;
    /**
     * When true, the panel shows a Form / Raw toggle for this section.
     * Raw mode defers to the extension via the `rawMode` prop (e.g. JSON editor).
     */
    supportsRaw?: boolean;
}
