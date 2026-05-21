import { addComponent, defineQuery, hasComponent } from "bitecs";
import { Geometry, Material, Mesh, type Context } from "@merlinn/helios-core";
import { parseGeometryDescriptor, parseMaterialDescriptor } from "@merlinn/helios-core";
import * as THREE from "three";
import {
    isResolvedThreeResource,
    resolveAndApplyGeometry,
    resolveAndApplyMaterial,
    resolveRefField,
} from "../assets/resolveGeometryMaterialRef";
import { MeshResourcesResolved, ThreeMesh } from "../components";
import { buildMaterialFromDescriptor, createGeometryFromDescriptor } from "./descriptors";

/**
 * Resolves core {@link Geometry} / {@link Material} into live THREE objects on {@link ThreeMesh}.
 * Runs once per entity (guarded by {@link MeshResourcesResolved}).
 */
export function createThreeMeshResourceBuilder(): {
    id: string;
    build(ctx: Context): Promise<void>;
} {
    const query = defineQuery([Mesh, Geometry, Material]);

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
                    if (!resolveAndApplyGeometry(ctx, eid)) {
                        const guidRef = resolveRefField(ctx, Geometry, eid, "guid");
                        if (typeof guidRef === "string" && guidRef.length > 0) {
                            await ctx.assetManager.loadAsset(guidRef);
                            resolveAndApplyGeometry(ctx, eid);
                        } else {
                            const descRaw = resolveRefField(ctx, Geometry, eid, "descriptor");
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
                            } else if (
                                descRaw !== undefined &&
                                descRaw !== null &&
                                !isResolvedThreeResource(descRaw)
                            ) {
                                console.warn(
                                    `[ThreeMeshResourceBuilder] Unsupported geometry descriptor for eid=${eid}`,
                                    descRaw,
                                );
                            }
                        }
                    }
                }

                if (hasComponent(world, Material, eid)) {
                    if (!resolveAndApplyMaterial(ctx, eid)) {
                        const guidRef = resolveRefField(ctx, Material, eid, "guid");
                        if (typeof guidRef === "string" && guidRef.length > 0) {
                            await ctx.assetManager.loadAsset(guidRef);
                            resolveAndApplyMaterial(ctx, eid);
                        } else {
                            const descRaw = resolveRefField(ctx, Material, eid, "descriptor");
                            const parsed = parseMaterialDescriptor(descRaw);
                            if (parsed) {
                                const mat = await buildMaterialFromDescriptor(ctx, parsed);
                                if (mat) {
                                    ThreeMesh.material[eid] = ctx.resources.set(mat);
                                } else {
                                    console.warn(
                                        `[ThreeMeshResourceBuilder] Failed to create material for eid=${eid}`,
                                        descRaw,
                                    );
                                }
                            } else if (
                                descRaw !== undefined &&
                                descRaw !== null &&
                                !isResolvedThreeResource(descRaw)
                            ) {
                                console.warn(
                                    `[ThreeMeshResourceBuilder] Unsupported material descriptor for eid=${eid}`,
                                    descRaw,
                                );
                            }
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
