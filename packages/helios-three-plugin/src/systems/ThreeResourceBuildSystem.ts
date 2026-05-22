import { addComponent, defineQuery, hasComponent } from "bitecs";
import { Geometry, Material, Mesh, System } from "@merlinn/helios-core";
import { parseGeometryDescriptor, parseMaterialDescriptor } from "@merlinn/helios-core";
import * as THREE from "three";
import { createGeometryFromDescriptor } from "../builders/descriptors";
import {
    createMaterialFromDescriptor,
    createTextureResolver,
    threeSideFromDescriptor,
} from "../builders/materialFromDescriptor";
import { collectTextureGuidsFromMaterialDescriptor } from "@merlinn/helios-core";
import {
    assetGuidCacheKey,
    descriptorCacheKey,
    isResolvedThreeResource,
    resolveAndApplyGeometry,
    resolveAndApplyMaterial,
    resolveRefField,
} from "../assets/resolveGeometryMaterialRef";
import { MeshResourcesResolved, ThreeMesh, ThreeObject } from "../components";
import { ensureGeometryUv2FromUv } from "../assets/geometryUv";
import { removeStaleTaggedObjectsForEntity } from "../entityThreeObject";
import { getThreeRenderContext } from "../ThreeRenderContext";

function hashDescriptorJson(value: unknown): number {
    if (typeof value !== "object" || value === null) {
        return 0;
    }
    let hash = 0;
    const s = JSON.stringify(value);
    for (let i = 0; i < s.length; i++) {
        hash = (hash * 31 + s.charCodeAt(i)) | 0;
    }
    return hash >>> 0;
}

const geometryResourceByDescHash = new Map<number, number>();
const materialResourceByDescHash = new Map<number, number>();

/**
 * Per-frame resolver for editor-created entities.
 * Turns core {@link Geometry} / {@link Material} into runtime resources on {@link ThreeMesh}.
 */
export class ThreeResourceBuildSystem extends System {
    static override readonly systemName = "ThreeResourceBuildSystem";
    static override readonly systemDescription =
        "Resolves Geometry/Material into Three.js resources for meshes (including in the editor).";
    static override readonly runsInEditor = true;

    private readonly query = defineQuery([Mesh, Geometry, Material, ThreeObject]);
    private readonly textureLoadsPending = new Set<number>();

    update(): void {
        const world = this.world;

        for (const eid of this.query(world)) {
            const needsGeometry = hasComponent(world, Geometry, eid);
            const needsMaterial = hasComponent(world, Material, eid);
            if (!needsGeometry && !needsMaterial) continue;

            if (!hasComponent(world, ThreeMesh, eid)) {
                continue;
            }

            if (!hasComponent(world, MeshResourcesResolved, eid)) {
                addComponent(world, MeshResourcesResolved, eid);
            } else if (MeshResourcesResolved.built[eid] === 1) {
                const geoGuidId = needsGeometry ? assetGuidCacheKey(Geometry, eid) : 0;
                const geoDescId = needsGeometry ? descriptorCacheKey(Geometry, eid) : 0;
                const matGuidId = needsMaterial ? assetGuidCacheKey(Material, eid) : 0;
                const matDescId = needsMaterial ? descriptorCacheKey(Material, eid) : 0;
                const unchanged =
                    (!needsGeometry ||
                        (MeshResourcesResolved.geoGuidId[eid] === geoGuidId &&
                            MeshResourcesResolved.geoDescId[eid] === geoDescId)) &&
                    (!needsMaterial ||
                        (MeshResourcesResolved.matGuidId[eid] === matGuidId &&
                            MeshResourcesResolved.matDescId[eid] === matDescId));
                if (unchanged) {
                    continue;
                }
            }

            const geoGuidId = needsGeometry ? assetGuidCacheKey(Geometry, eid) : 0;
            const geoDescId = needsGeometry ? descriptorCacheKey(Geometry, eid) : 0;
            const matGuidId = needsMaterial ? assetGuidCacheKey(Material, eid) : 0;
            const matDescId = needsMaterial ? descriptorCacheKey(Material, eid) : 0;

            const changed =
                (needsGeometry &&
                    (MeshResourcesResolved.geoGuidId[eid] !== geoGuidId ||
                        MeshResourcesResolved.geoDescId[eid] !== geoDescId)) ||
                (needsMaterial &&
                    (MeshResourcesResolved.matGuidId[eid] !== matGuidId ||
                        MeshResourcesResolved.matDescId[eid] !== matDescId));

            if (changed) {
                MeshResourcesResolved.built[eid] = 0;
                MeshResourcesResolved.geoGuidId[eid] = geoGuidId;
                MeshResourcesResolved.geoDescId[eid] = geoDescId;
                MeshResourcesResolved.matGuidId[eid] = matGuidId;
                MeshResourcesResolved.matDescId[eid] = matDescId;

                ThreeMesh.geometry[eid] = 0;
                ThreeMesh.material[eid] = 0;

                const root = getThreeRenderContext(this.context).getWorldRoot();
                const live = ThreeObject.get(eid).object as THREE.Object3D | undefined;
                removeStaleTaggedObjectsForEntity(root, eid, live);
            }

            if (MeshResourcesResolved.built[eid] === 1) {
                continue;
            }

            if (needsGeometry && (ThreeMesh.geometry[eid] ?? 0) === 0) {
                if (!resolveAndApplyGeometry(this.context, eid)) {
                    const descRaw = resolveRefField(this.context, Geometry, eid, "descriptor");
                    const parsed = parseGeometryDescriptor(descRaw);
                    if (parsed) {
                        const descHash = hashDescriptorJson(parsed);
                        let geoId = geometryResourceByDescHash.get(descHash);
                        if (geoId === undefined) {
                            const geo = createGeometryFromDescriptor(parsed);
                            if (!geo) {
                                console.warn(
                                    `[ThreeResourceBuildSystem] Invalid geometry descriptor eid=${eid}`,
                                    descRaw,
                                );
                                continue;
                            }
                            geoId = this.context.resources.set(geo);
                            geometryResourceByDescHash.set(descHash, geoId);
                        }
                        ThreeMesh.geometry[eid] = geoId;
                    } else if (
                        descRaw !== undefined &&
                        descRaw !== null &&
                        !isResolvedThreeResource(descRaw)
                    ) {
                        console.warn(`[ThreeResourceBuildSystem] Unsupported geometry descriptor eid=${eid}`, descRaw);
                    }
                }
            }

            if (needsMaterial && (ThreeMesh.material[eid] ?? 0) === 0) {
                if (!resolveAndApplyMaterial(this.context, eid)) {
                    const descRaw = resolveRefField(this.context, Material, eid, "descriptor");
                    const parsed = parseMaterialDescriptor(descRaw);
                    if (parsed) {
                        const texGuids = collectTextureGuidsFromMaterialDescriptor(parsed);
                        const missingTex = texGuids.filter(
                            (guid) => !this.context.assetManager.hasAsset(guid),
                        );
                        if (missingTex.length > 0) {
                            if (!this.textureLoadsPending.has(eid)) {
                                this.textureLoadsPending.add(eid);
                                void Promise.all(
                                    missingTex.map((guid) =>
                                        this.context.assetManager.loadAsset(guid),
                                    ),
                                )
                                    .catch((err) => {
                                        console.warn(
                                            `[ThreeResourceBuildSystem] texture preload failed eid=${eid}`,
                                            err,
                                        );
                                    })
                                    .finally(() => {
                                        this.textureLoadsPending.delete(eid);
                                        if (hasComponent(world, MeshResourcesResolved, eid)) {
                                            MeshResourcesResolved.built[eid] = 0;
                                        }
                                    });
                            }
                            continue;
                        }

                        const descHash = hashDescriptorJson(parsed);
                        let matId = materialResourceByDescHash.get(descHash);
                        if (matId === undefined) {
                            const mat = createMaterialFromDescriptor(
                                parsed,
                                createTextureResolver(this.context),
                            );
                            if (!mat) {
                                console.warn(
                                    `[ThreeResourceBuildSystem] Invalid material descriptor eid=${eid}`,
                                    descRaw,
                                );
                                continue;
                            }
                            matId = this.context.resources.set(mat);
                            materialResourceByDescHash.set(descHash, matId);
                        }
                        ThreeMesh.material[eid] = matId;
                    } else if (
                        descRaw !== undefined &&
                        descRaw !== null &&
                        !isResolvedThreeResource(descRaw)
                    ) {
                        console.warn(`[ThreeResourceBuildSystem] Unsupported material descriptor eid=${eid}`, descRaw);
                    }
                }
            }

            const geoOk = !needsGeometry || ThreeMesh.geometry[eid] > 0;
            const matOk = !needsMaterial || ThreeMesh.material[eid] > 0;
            if (geoOk && matOk) {
                const obj = ThreeObject.get(eid).object;
                if (obj instanceof THREE.Mesh) {
                    if (needsGeometry) {
                        const geo = this.context.resources.get(
                            ThreeMesh.geometry[eid],
                        ) as THREE.BufferGeometry;
                        ensureGeometryUv2FromUv(geo);
                        obj.geometry = geo;
                    }
                    if (needsMaterial) {
                        const mat = this.context.resources.get(
                            ThreeMesh.material[eid],
                        ) as THREE.Material;
                        const descRaw = resolveRefField(this.context, Material, eid, "descriptor");
                        const parsed = parseMaterialDescriptor(descRaw);
                        if (parsed?.side) {
                            mat.side = threeSideFromDescriptor(parsed.side);
                            mat.needsUpdate = true;
                        }
                        obj.material = mat;
                    }
                }
                MeshResourcesResolved.built[eid] = 1;
            }
        }
    }
}
