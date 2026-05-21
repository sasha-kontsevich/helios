import { defineComponent } from "../engine/Component";

/** References a {@link ModelManifest} asset; expanded to mesh entities on scene load or via {@link EngineAPI.spawnModelInstance}. */
export const ModelInstance = defineComponent({
    model: "",
});
