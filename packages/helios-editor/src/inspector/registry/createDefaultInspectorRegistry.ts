import { markRaw } from "vue";
import ThreeGeometryRefInspector from "../ThreeGeometryRefInspector.vue";
import ThreeMaterialRefInspector from "../ThreeMaterialRefInspector.vue";
import RotationInspector from "../RotationInspector.vue";
import Vec3ComponentInspector from "../Vec3ComponentInspector.vue";
import { EditorInspectorRegistry } from "./EditorInspectorRegistry";
import type { ComponentInspectorExtension } from "./inspectorTypes";

function builtInExtensions(): ComponentInspectorExtension[] {
    const Vec3 = markRaw(Vec3ComponentInspector);
    const Rot = markRaw(RotationInspector);
    const Geo = markRaw(ThreeGeometryRefInspector);
    const Mat = markRaw(ThreeMaterialRefInspector);
    return [
        {
            id: "builtin-inspector-position",
            componentNames: ["Position"],
            priority: 0,
            supportsRaw: true,
            view: Vec3,
        },
        {
            id: "builtin-inspector-rotation",
            componentNames: ["Rotation"],
            priority: 0,
            supportsRaw: true,
            view: Rot,
        },
        {
            id: "builtin-inspector-scale",
            componentNames: ["Scale"],
            priority: 0,
            supportsRaw: true,
            view: Vec3,
        },
        {
            id: "builtin-inspector-three-geometry-ref",
            componentNames: ["ThreeGeometryRef"],
            priority: 0,
            supportsRaw: true,
            view: Geo,
        },
        {
            id: "builtin-inspector-three-material-ref",
            componentNames: ["ThreeMaterialRef"],
            priority: 0,
            supportsRaw: true,
            view: Mat,
        },
    ];
}

/**
 * Built-in component inspector views plus optional host overrides.
 * Host extensions should use {@link ComponentInspectorExtension.priority} &gt; 0 to replace built-ins.
 */
export function createDefaultInspectorRegistry(
    hostExtensions?: readonly ComponentInspectorExtension[],
): EditorInspectorRegistry {
    const registry = new EditorInspectorRegistry();
    registry.registerAll(builtInExtensions());
    if (hostExtensions?.length) {
        registry.registerAll(hostExtensions);
    }
    return registry;
}
