import { markRaw } from "vue";
import GeometryInspector from "../GeometryInspector.vue";
import MaterialInspector from "../MaterialInspector.vue";
import ModelInstanceInspector from "../ModelInstanceInspector.vue";
import RotationInspector from "../RotationInspector.vue";
import Vec3ComponentInspector from "../Vec3ComponentInspector.vue";
import { EditorInspectorRegistry } from "./EditorInspectorRegistry";
import type { ComponentInspectorExtension } from "./inspectorTypes";

function builtInExtensions(): ComponentInspectorExtension[] {
    const Vec3 = markRaw(Vec3ComponentInspector);
    const Rot = markRaw(RotationInspector);
    const Geo = markRaw(GeometryInspector);
    const Mat = markRaw(MaterialInspector);
    const ModelInst = markRaw(ModelInstanceInspector);
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
            id: "builtin-inspector-geometry",
            componentNames: ["Geometry"],
            priority: 0,
            supportsRaw: true,
            view: Geo,
        },
        {
            id: "builtin-inspector-material",
            componentNames: ["Material"],
            priority: 0,
            supportsRaw: true,
            view: Mat,
        },
        {
            id: "builtin-inspector-model-instance",
            componentNames: ["ModelInstance"],
            priority: 0,
            supportsRaw: false,
            view: ModelInst,
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
