import type { Context } from "@merlinn/helios-core";
import {
    collectTextureGuidsFromMaterialDescriptor,
    materialTextureSlotsForType,
    type MaterialDescriptor,
    type MaterialTextureSlot,
} from "@merlinn/helios-core";
import * as THREE from "three";

export type TextureResolver = (guid: string) => THREE.Texture | undefined;

/** Linear color space for data maps (normal, roughness, metalness, AO). */
const LINEAR_TEXTURE_SLOTS = new Set<MaterialTextureSlot>([
    "normalMap",
    "roughnessMap",
    "metalnessMap",
    "aoMap",
]);

function configureTextureForSlot(tex: THREE.Texture, slot: MaterialTextureSlot): void {
    if (LINEAR_TEXTURE_SLOTS.has(slot)) {
        tex.colorSpace = THREE.LinearSRGBColorSpace;
        tex.flipY = false;
    } else {
        tex.colorSpace = THREE.SRGBColorSpace;
    }
    tex.needsUpdate = true;
}

function applyTextureSlots(
    material: THREE.Material,
    desc: MaterialDescriptor,
    resolveTexture: TextureResolver,
): void {
    for (const slot of materialTextureSlotsForType(desc.type)) {
        const guid = (desc as unknown as Record<string, unknown>)[slot];
        if (typeof guid !== "string" || guid.length === 0) continue;
        const tex = resolveTexture(guid);
        if (!tex) continue;
        configureTextureForSlot(tex, slot);
        (material as THREE.MeshStandardMaterial & Record<string, THREE.Texture | undefined>)[
            slot
        ] = tex;
    }

    if (desc.type === "meshStandard") {
        const std = material as THREE.MeshStandardMaterial;
        if (std.aoMap) {
            std.aoMapIntensity = 1;
        }
        if (std.normalMap) {
            std.normalScale.set(1, 1);
        }
    }

    material.needsUpdate = true;
}

export function createMaterialFromDescriptor(
    desc: MaterialDescriptor,
    resolveTexture?: TextureResolver,
): THREE.Material | null {
    try {
        switch (desc.type) {
            case "meshBasic": {
                const mat = new THREE.MeshBasicMaterial({
                    color: desc.color,
                    wireframe: desc.wireframe ?? false,
                });
                if (resolveTexture) applyTextureSlots(mat, desc, resolveTexture);
                return mat;
            }
            case "meshLambert": {
                const opts: THREE.MeshLambertMaterialParameters = {
                    color: desc.color,
                    wireframe: desc.wireframe ?? false,
                };
                if (desc.emissive !== undefined) opts.emissive = desc.emissive;
                const mat = new THREE.MeshLambertMaterial(opts);
                if (resolveTexture) applyTextureSlots(mat, desc, resolveTexture);
                return mat;
            }
            case "meshStandard": {
                const mat = new THREE.MeshStandardMaterial({
                    color: desc.color,
                    roughness: desc.roughness,
                    metalness: desc.metalness,
                    wireframe: desc.wireframe ?? false,
                });
                if (resolveTexture) applyTextureSlots(mat, desc, resolveTexture);
                return mat;
            }
            default:
                return null;
        }
    } catch {
        return null;
    }
}

export function createTextureResolver(ctx: Context): TextureResolver {
    return (guid: string) => {
        try {
            if (!ctx.assetManager.hasAsset(guid)) {
                return undefined;
            }
            return ctx.resources.get<THREE.Texture>(ctx.assetManager.getResourceId(guid));
        } catch {
            return undefined;
        }
    };
}

/** Load texture dependencies, then build a THREE material from a core descriptor. */
export async function buildMaterialFromDescriptor(
    ctx: Context,
    desc: MaterialDescriptor,
): Promise<THREE.Material | null> {
    const guids = collectTextureGuidsFromMaterialDescriptor(desc);
    await Promise.all(
        guids.map((guid: string) =>
            ctx.assetManager.loadAsset(guid).catch((err) => {
                console.warn(`[buildMaterialFromDescriptor] texture load failed: ${guid}`, err);
            }),
        ),
    );
    return createMaterialFromDescriptor(desc, createTextureResolver(ctx));
}
