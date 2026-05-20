/**
 * ECS components that exist for Three.js runtime wiring; hide from the friendly inspector
 * unless the user enables "runtime internals" in the panel header.
 */
export const INTERNAL_INSPECTOR_COMPONENT_NAMES = new Set([
    "MeshResourcesResolved",
    "ThreeMesh",
    "ThreeObject",
]);

export function isInternalInspectorComponent(componentName: string): boolean {
    return INTERNAL_INSPECTOR_COMPONENT_NAMES.has(componentName);
}
