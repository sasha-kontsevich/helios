import type { SceneEntityInstance } from "../types/SceneData";
import type { MaterialDescriptor } from "./descriptors";
import { parseMaterialDescriptor } from "./descriptors";

/** Serializable texture slot on a material descriptor (GUID string). */
export type MaterialTextureSlot =
    | "map"
    | "normalMap"
    | "roughnessMap"
    | "metalnessMap"
    | "aoMap"
    | "emissiveMap";

const SLOTS_BY_MATERIAL_TYPE: Record<MaterialDescriptor["type"], MaterialTextureSlot[]> = {
    meshBasic: ["map"],
    meshLambert: ["map", "emissiveMap"],
    meshStandard: ["map", "normalMap", "roughnessMap", "metalnessMap", "aoMap", "emissiveMap"],
};

/** Texture slots valid for a parsed material descriptor type. */
export function materialTextureSlotsForType(
    type: MaterialDescriptor["type"],
): MaterialTextureSlot[] {
    return SLOTS_BY_MATERIAL_TYPE[type] ?? [];
}

/** Collect non-empty texture GUIDs referenced by a material descriptor. */
export function collectTextureGuidsFromMaterialDescriptor(desc: MaterialDescriptor): string[] {
    const out: string[] = [];
    for (const slot of materialTextureSlotsForType(desc.type)) {
        const guid = (desc as unknown as Record<string, unknown>)[slot];
        if (typeof guid === "string" && guid.length > 0) {
            out.push(guid);
        }
    }
    return out;
}

/** Walk scene entity component maps for `Material.descriptor` and `Skybox.texture` GUIDs. */
export function collectTextureGuidsFromSceneEntities(entities: SceneEntityInstance[]): string[] {
    const set = new Set<string>();
    for (const inst of entities) {
        const sky = inst.components?.Skybox as { texture?: unknown } | undefined;
        if (typeof sky?.texture === "string" && sky.texture.length > 0) {
            set.add(sky.texture);
        }
        const mat = inst.components?.Material as { descriptor?: unknown } | undefined;
        if (!mat?.descriptor) continue;
        const parsed = parseMaterialDescriptor(mat.descriptor);
        if (!parsed) continue;
        for (const g of collectTextureGuidsFromMaterialDescriptor(parsed)) {
            set.add(g);
        }
    }
    return [...set];
}
