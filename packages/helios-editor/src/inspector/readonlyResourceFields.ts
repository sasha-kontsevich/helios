/**
 * Names of component fields that hold packed resource / handle IDs.
 * Editing these as raw numbers can break Three.js wiring — keep read-only in the inspector MVP.
 */
export const READONLY_RESOURCE_FIELD_NAMES = new Set([
    "object",
    "geometry",
    "material",
]);

export function isReadonlyResourceField(fieldName: string): boolean {
    return READONLY_RESOURCE_FIELD_NAMES.has(fieldName);
}
