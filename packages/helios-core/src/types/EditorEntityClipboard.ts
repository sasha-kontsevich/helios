/**
 * Versioned payload for editor copy/paste and future import/export (single entity).
 * Extend with new `version` values and migration helpers as the format evolves.
 */

export const EDITOR_ENTITY_CLIPBOARD_MIME = "application/vnd.helios.editor-entity+json";

export const EDITOR_ENTITY_CLIPBOARD_SCHEMA = "helios.editor.entity" as const;

export const EDITOR_ENTITY_CLIPBOARD_VERSION = 1 as const;

export interface EditorEntityClipboardV1 {
    readonly schema: typeof EDITOR_ENTITY_CLIPBOARD_SCHEMA;
    readonly version: typeof EDITOR_ENTITY_CLIPBOARD_VERSION;
    /** Serializable component field maps (same shape as scene entity instances). */
    readonly components: Record<string, Record<string, unknown>>;
}

/**
 * Remove runtime-only or stale fields so pasted entities rebuild meshes/lights correctly.
 * Safe to expand per-component as new editor-facing types appear.
 */
export function stripRuntimeFieldsForEntityClipboard(
    components: Record<string, Record<string, unknown>>,
): Record<string, Record<string, unknown>> {
    const out: Record<string, Record<string, unknown>> = {};
    for (const [name, fields] of Object.entries(components)) {
        if (name === "ThreeResourcesBuilt") {
            continue;
        }
        const clone: Record<string, unknown> = { ...fields };
        if (name === "ThreeMesh") {
            delete clone.geometry;
            delete clone.material;
        }
        if (name === "ThreeObject") {
            delete clone.object;
        }
        out[name] = clone;
    }
    return out;
}

export function buildEditorEntityClipboardV1(
    components: Record<string, Record<string, unknown>>,
): EditorEntityClipboardV1 {
    return {
        schema: EDITOR_ENTITY_CLIPBOARD_SCHEMA,
        version: EDITOR_ENTITY_CLIPBOARD_VERSION,
        components: stripRuntimeFieldsForEntityClipboard(components),
    };
}

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Parse clipboard JSON. Accepts strict v1 or a minimal `{ components }` object for forward compatibility.
 */
export function parseEditorEntityClipboardPayload(data: unknown): EditorEntityClipboardV1 {
    if (!isRecord(data)) {
        throw new Error("[EditorEntityClipboard] Payload must be a JSON object.");
    }

    let components: unknown = data.components;
    const schema = data.schema;
    const version = data.version;

    if (components === undefined && isRecord(data) && Object.keys(data).length > 0) {
        const keys = Object.keys(data).filter((k) => k !== "schema" && k !== "version");
        if (keys.length > 0 && keys.every((k) => isRecord((data as Record<string, unknown>)[k]))) {
            components = data;
        }
    }

    if (!isRecord(components)) {
        throw new Error("[EditorEntityClipboard] Missing or invalid `components`.");
    }

    if (schema !== undefined && schema !== EDITOR_ENTITY_CLIPBOARD_SCHEMA) {
        throw new Error(`[EditorEntityClipboard] Unsupported schema: ${String(schema)}`);
    }
    if (version !== undefined && version !== EDITOR_ENTITY_CLIPBOARD_VERSION) {
        throw new Error(`[EditorEntityClipboard] Unsupported version: ${String(version)}`);
    }

    const normalized: Record<string, Record<string, unknown>> = {};
    for (const [compName, fields] of Object.entries(components)) {
        if (compName === "schema" || compName === "version") continue;
        if (!isRecord(fields)) {
            throw new Error(`[EditorEntityClipboard] Invalid component map for "${compName}".`);
        }
        normalized[compName] = { ...fields };
    }

    return buildEditorEntityClipboardV1(normalized);
}

export function parseEditorEntityClipboardJson(text: string): EditorEntityClipboardV1 {
    let data: unknown;
    try {
        data = JSON.parse(text) as unknown;
    } catch {
        throw new Error("[EditorEntityClipboard] Invalid JSON.");
    }
    return parseEditorEntityClipboardPayload(data);
}
