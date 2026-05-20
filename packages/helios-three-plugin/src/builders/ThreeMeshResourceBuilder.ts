import { addComponent, defineQuery, hasComponent } from "bitecs";
import { Geometry, Material, Mesh, type Context } from "@merlinn/helios-core";
import { parseGeometryDescriptor, parseMaterialDescriptor } from "@merlinn/helios-core";
import * as THREE from "three";
import { MeshResourcesResolved, ThreeMesh, ThreeObject } from "../components";
import { createGeometryFromDescriptor, createMaterialFromDescriptor } from "./descriptors";

function resolveRefField(
    ctx: Context,
    refComponent: typeof Geometry | typeof Material,
    eid: number,
    field: "guid" | "descriptor",
): unknown {
    if (typeof refComponent?.get === "function") {
        try {
            return refComponent.get(eid)?.[field];
        } catch {
            // ignore
        }
    }
    const id = refComponent?.[field]?.[eid] as number | undefined;
    return id ? ctx.resources.getOrNot(id) : undefined;
}

/**
 * Resolves core {@link Geometry} / {@link Material} into live THREE objects on {@link ThreeMesh}.
 * Runs once per entity (guarded by {@link MeshResourcesResolved}).
 */
export function createThreeMeshResourceBuilder(): {
    id: string;
    build(ctx: Context): Promise<void>;
} {
    const query = defineQuery([Mesh, Geometry, Material, ThreeObject]);

    return {
        id: "helios.three.meshResources",
        async build(ctx: Context): Promise<void> {
            const world = ctx.ecsWorld;
            for (const eid of query(world)) {
                if (hasComponent(world, MeshResourcesResolved, eid) && MeshResourcesResolved.built[eid] === 1) {
                    continue;
                }

                if (!hasComponent(world, ThreeMesh, eid)) {
                    continue;
                }

                if (hasComponent(world, Geometry, eid)) {
                    const guid = resolveRefField(ctx, Geometry, eid, "guid");
                    const descRaw = resolveRefField(ctx, Geometry, eid, "descriptor");

                    if (guid && typeof guid === "string" && guid.length > 0) {
                        await ctx.assetManager.loadAsset(guid);
                        const rid = ctx.assetManager.getResourceId(guid);
                        const loaded = ctx.resources.get<unknown>(rid);
                        if (!(loaded instanceof THREE.BufferGeometry)) {
                            console.warn(
                                `[ThreeMeshResourceBuilder] Asset "${guid}" is not a THREE.BufferGeometry; skipping geometry for eid=${eid}`,
                            );
                        } else {
                            ThreeMesh.geometry[eid] = ctx.resources.set(loaded);
                        }
                    } else {
                        const parsed = parseGeometryDescriptor(descRaw);
                        if (parsed) {
                            const geo = createGeometryFromDescriptor(parsed);
                            if (geo) {
                                ThreeMesh.geometry[eid] = ctx.resources.set(geo);
                            } else {
                                console.warn(
                                    `[ThreeMeshResourceBuilder] Failed to create geometry for eid=${eid}`,
                                    descRaw,
                                );
                            }
                        } else if (descRaw !== undefined && descRaw !== null) {
                            console.warn(
                                `[ThreeMeshResourceBuilder] Unsupported geometry descriptor for eid=${eid}`,
                                descRaw,
                            );
                        }
                    }
                }

                if (hasComponent(world, Material, eid)) {
                    const guid = resolveRefField(ctx, Material, eid, "guid");
                    const descRaw = resolveRefField(ctx, Material, eid, "descriptor");

                    if (guid && typeof guid === "string" && guid.length > 0) {
                        await ctx.assetManager.loadAsset(guid);
                        const rid = ctx.assetManager.getResourceId(guid);
                        const loaded = ctx.resources.get<unknown>(rid);
                        if (!(loaded instanceof THREE.Material)) {
                            console.warn(
                                `[ThreeMeshResourceBuilder] Asset "${guid}" is not a THREE.Material; skipping material for eid=${eid}`,
                            );
                        } else {
                            ThreeMesh.material[eid] = ctx.resources.set(loaded);
                        }
                    } else {
                        const parsed = parseMaterialDescriptor(descRaw);
                        if (parsed) {
                            const mat = createMaterialFromDescriptor(parsed);
                            if (mat) {
                                ThreeMesh.material[eid] = ctx.resources.set(mat);
                            } else {
                                console.warn(
                                    `[ThreeMeshResourceBuilder] Failed to create material for eid=${eid}`,
                                    descRaw,
                                );
                            }
                        } else if (descRaw !== undefined && descRaw !== null) {
                            console.warn(
                                `[ThreeMeshResourceBuilder] Unsupported material descriptor for eid=${eid}`,
                                descRaw,
                            );
                        }
                    }
                }

                const geoOk = !hasComponent(world, Geometry, eid) || ThreeMesh.geometry[eid] > 0;
                const matOk = !hasComponent(world, Material, eid) || ThreeMesh.material[eid] > 0;
                if (geoOk && matOk) {
                    if (!hasComponent(world, MeshResourcesResolved, eid)) {
                        addComponent(world, MeshResourcesResolved, eid);
                    }
                    MeshResourcesResolved.built[eid] = 1;
                }
            }
        },
    };
}
