import type { Context } from "@merlinn/helios-core";
import { Geometry, Material, parseMaterialDescriptor } from "@merlinn/helios-core";
import * as THREE from "three";
import { ThreeMesh } from "../components";

/** Duck-type check that survives duplicate `three` bundles (no cross-realm instanceof). */
function isBufferGeometryLike(v: unknown): v is THREE.BufferGeometry {
    if (typeof v !== "object" || v === null) {
        return false;
    }
    const o = v as { isBufferGeometry?: boolean; type?: string; attributes?: unknown };
    return (
        o.isBufferGeometry === true ||
        (o.type === "BufferGeometry" && typeof o.attributes === "object" && o.attributes !== null)
    );
}

function isMaterialLike(v: unknown): v is THREE.Material {
    if (typeof v !== "object" || v === null) {
        return false;
    }
    const o = v as {
        isMaterial?: boolean;
        isMeshStandardMaterial?: boolean;
        type?: string;
        uuid?: string;
    };
    return (
        o.isMaterial === true ||
        o.isMeshStandardMaterial === true ||
        (typeof o.type === "string" &&
            typeof o.uuid === "string" &&
            /Material$/.test(o.type))
    );
}

function isEmptyDescriptorObject(v: unknown): boolean {
    return (
        typeof v === "object" &&
        v !== null &&
        !isBufferGeometryLike(v) &&
        !isMaterialLike(v) &&
        Object.keys(v as object).length === 0
    );
}

/** Read asset GUID string stored on {@link Geometry} / {@link Material} (proxy, not TypedArray). */
export function readAssetGuidString(
    refComponent: typeof Geometry | typeof Material,
    eid: number,
): string | undefined {
    if (typeof refComponent?.get !== "function") {
        return undefined;
    }
    try {
        const v = refComponent.get(eid)?.guid;
        return typeof v === "string" && v.length > 0 ? v : undefined;
    } catch {
        return undefined;
    }
}

function loadFromAssetGuid(ctx: Context, guid: string): unknown {
    if (!ctx.assetManager.hasAsset(guid)) {
        return undefined;
    }
    return ctx.resources.get(ctx.assetManager.getResourceId(guid));
}

/**
 * Resolve {@link Geometry} / {@link Material} guid or descriptor field for one entity.
 */
export function resolveRefField(
    ctx: Context,
    refComponent: typeof Geometry | typeof Material,
    eid: number,
    field: "guid" | "descriptor",
): unknown {
    if (typeof refComponent?.get === "function") {
        try {
            const proxyVal = refComponent.get(eid)?.[field];
            if (isResolvedThreeResource(proxyVal)) {
                return proxyVal;
            }
            if (field === "guid" && typeof proxyVal === "string" && proxyVal.length > 0) {
                const loaded = loadFromAssetGuid(ctx, proxyVal);
                if (loaded !== undefined) {
                    return loaded;
                }
                return proxyVal;
            }
            if (!isEmptyDescriptorObject(proxyVal)) {
                return proxyVal;
            }
        } catch {
            // ignore
        }
    }

    if (field === "guid") {
        const guidStr = readAssetGuidString(refComponent, eid);
        if (guidStr) {
            const loaded = loadFromAssetGuid(ctx, guidStr);
            if (loaded !== undefined) {
                return loaded;
            }
        }
    }

    const rawId = refComponent?.[field]?.[eid] as number | undefined;
    if (rawId) {
        const fromResources = ctx.resources.getOrNot(rawId);
        if (fromResources !== undefined) {
            return fromResources;
        }
    }

    return undefined;
}

function assignGeometryResource(ctx: Context, eid: number, geometry: THREE.BufferGeometry, guid?: string): void {
    if (guid && ctx.assetManager.hasAsset(guid)) {
        ThreeMesh.geometry[eid] = ctx.assetManager.getResourceId(guid);
        return;
    }
    ThreeMesh.geometry[eid] = ctx.resources.set(geometry);
}

function assignMaterialResource(ctx: Context, eid: number, material: THREE.Material, guid?: string): void {
    if (guid && ctx.assetManager.hasAsset(guid)) {
        ThreeMesh.material[eid] = ctx.assetManager.getResourceId(guid);
        return;
    }
    ThreeMesh.material[eid] = ctx.resources.set(material);
}

export function applyResolvedGeometry(ctx: Context, eid: number, ref: unknown): boolean {
    if (isBufferGeometryLike(ref)) {
        assignGeometryResource(ctx, eid, ref);
        return true;
    }
    if (typeof ref === "string" && ref.length > 0) {
        const loaded = loadFromAssetGuid(ctx, ref);
        if (isBufferGeometryLike(loaded)) {
            assignGeometryResource(ctx, eid, loaded, ref);
            return true;
        }
    }
    return false;
}

export function applyResolvedMaterial(ctx: Context, eid: number, ref: unknown): boolean {
    if (isMaterialLike(ref)) {
        assignMaterialResource(ctx, eid, ref);
        return true;
    }
    if (typeof ref === "string" && ref.length > 0) {
        const loaded = loadFromAssetGuid(ctx, ref);
        if (isMaterialLike(loaded)) {
            assignMaterialResource(ctx, eid, loaded, ref);
            return true;
        }
    }
    return false;
}

export function resolveAndApplyGeometry(ctx: Context, eid: number): boolean {
    const guidRef = resolveRefField(ctx, Geometry, eid, "guid");
    const descRef = resolveRefField(ctx, Geometry, eid, "descriptor");
    return applyResolvedGeometry(ctx, eid, guidRef) || applyResolvedGeometry(ctx, eid, descRef);
}

export function resolveAndApplyMaterial(ctx: Context, eid: number): boolean {
    const descRef = resolveRefField(ctx, Material, eid, "descriptor");
    if (!isResolvedThreeResource(descRef) && parseMaterialDescriptor(descRef)) {
        // Inline descriptor wins over imported GLTF sub-asset guid (see Material inspector).
        return false;
    }
    const guidRef = resolveRefField(ctx, Material, eid, "guid");
    return applyResolvedMaterial(ctx, eid, guidRef) || applyResolvedMaterial(ctx, eid, descRef);
}

export function isResolvedThreeResource(ref: unknown): boolean {
    return isBufferGeometryLike(ref) || isMaterialLike(ref);
}

function hashString(s: string): number {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        hash = (hash * 31 + s.charCodeAt(i)) | 0;
    }
    return hash >>> 0;
}

/** Stable key for {@link MeshResourcesResolved} when guid is stored as a string in the proxy. */
export function assetGuidCacheKey(
    refComponent: typeof Geometry | typeof Material,
    eid: number,
): number {
    const guid = readAssetGuidString(refComponent, eid);
    return guid ? hashString(guid) : 0;
}

/**
 * Stable cache key for descriptor field (ignore proxy resource slot ids that change each write).
 */
export function descriptorCacheKey(
    refComponent: typeof Geometry | typeof Material,
    eid: number,
): number {
    if (typeof refComponent?.get !== "function") {
        return refComponent?.descriptor?.[eid] ?? 0;
    }
    try {
        const v = refComponent.get(eid)?.descriptor;
        if (v === undefined || v === null || isEmptyDescriptorObject(v)) {
            return 0;
        }
        if (isResolvedThreeResource(v)) {
            return 1;
        }
        if (typeof v === "object") {
            return hashString(JSON.stringify(v));
        }
    } catch {
        // ignore
    }
    return refComponent?.descriptor?.[eid] ?? 0;
}
