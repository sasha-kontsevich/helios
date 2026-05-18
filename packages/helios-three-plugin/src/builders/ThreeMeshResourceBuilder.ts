import { addComponent, defineQuery, hasComponent } from 'bitecs';
import type { Context } from '@merlinn/helios-core';
import * as THREE from 'three';
import {
    ThreeGeometryRef,
    ThreeMaterialRef,
    ThreeMesh,
    ThreeObject,
    ThreeResourcesBuilt,
} from '../components';
import {
    createGeometryFromDescriptor,
    createMaterialFromDescriptor,
    parseGeometryDescriptor,
    parseMaterialDescriptor,
} from './descriptors';

export type {
    GeometryDescriptor,
    GeometryDescriptorBox,
    GeometryDescriptorCone,
    GeometryDescriptorCylinder,
    GeometryDescriptorPlane,
    GeometryDescriptorSphere,
    GeometryDescriptorTorus,
    MaterialDescriptor,
    MaterialDescriptorMeshBasic,
    MaterialDescriptorMeshLambert,
    MaterialDescriptorMeshStandard,
} from './descriptors';

export {
    DEFAULT_GEOMETRY,
    DEFAULT_MATERIAL,
    defaultGeometryDescriptor,
    defaultMaterialDescriptor,
} from './descriptors';

function resolveRefField(
    ctx: Context,
    refComponent: any,
    eid: number,
    field: 'guid' | 'descriptor',
): unknown {
    if (typeof refComponent?.get === 'function') {
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
 * Resolves {@link ThreeGeometryRef} / {@link ThreeMaterialRef} into live THREE objects on {@link ThreeMesh}.
 * Runs once per entity (guarded by {@link ThreeResourcesBuilt}).
 */
export function createThreeMeshResourceBuilder(): {
    id: string;
    build(ctx: Context): Promise<void>;
} {
    const query = defineQuery([ThreeMesh, ThreeObject]);

    return {
        id: 'helios.three.meshResources',
        async build(ctx: Context): Promise<void> {
            const world = ctx.ecsWorld;
            let builtCount = 0;
            let checked = 0;
            for (const eid of query(world)) {
                checked++;
                if (hasComponent(world, ThreeResourcesBuilt, eid) && ThreeResourcesBuilt.built[eid] === 1) {
                    continue;
                }

                const needsGeometry = hasComponent(world, ThreeGeometryRef, eid);
                const needsMaterial = hasComponent(world, ThreeMaterialRef, eid);
                if (!needsGeometry && !needsMaterial) {
                    continue;
                }

                const mesh = ThreeMesh.get(eid);

                if (needsGeometry) {
                    const guid = resolveRefField(ctx, ThreeGeometryRef as any, eid, 'guid');
                    const descRaw = resolveRefField(ctx, ThreeGeometryRef as any, eid, 'descriptor');

                    if (guid && typeof guid === 'string' && guid.length > 0) {
                        await ctx.assetManager.loadAsset(guid);
                        const rid = ctx.assetManager.getResourceId(guid);
                        const loaded = ctx.resources.get<unknown>(rid);
                        if (!(loaded instanceof THREE.BufferGeometry)) {
                            console.warn(
                                `[ThreeMeshResourceBuilder] Asset "${guid}" is not a THREE.BufferGeometry; skipping geometry for eid=${eid}`,
                            );
                        } else {
                            (ThreeMesh as any).geometry[eid] = ctx.resources.set(loaded);
                        }
                    } else {
                        const parsed = parseGeometryDescriptor(descRaw);
                        if (parsed) {
                            const geo = createGeometryFromDescriptor(parsed);
                            if (geo) {
                                (ThreeMesh as any).geometry[eid] = ctx.resources.set(geo);
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

                if (needsMaterial) {
                    const guid = resolveRefField(ctx, ThreeMaterialRef as any, eid, 'guid');
                    const descRaw = resolveRefField(ctx, ThreeMaterialRef as any, eid, 'descriptor');

                    if (guid && typeof guid === 'string' && guid.length > 0) {
                        await ctx.assetManager.loadAsset(guid);
                        const rid = ctx.assetManager.getResourceId(guid);
                        const loaded = ctx.resources.get<unknown>(rid);
                        if (!(loaded instanceof THREE.Material)) {
                            console.warn(
                                `[ThreeMeshResourceBuilder] Asset "${guid}" is not a THREE.Material; skipping material for eid=${eid}`,
                            );
                        } else {
                            (ThreeMesh as any).material[eid] = ctx.resources.set(loaded);
                        }
                    } else {
                        const parsed = parseMaterialDescriptor(descRaw);
                        if (parsed) {
                            const mat = createMaterialFromDescriptor(parsed);
                            if (mat) {
                                (ThreeMesh as any).material[eid] = ctx.resources.set(mat);
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

                const geoOk = !needsGeometry || (ThreeMesh as any).geometry[eid] > 0;
                const matOk = !needsMaterial || (ThreeMesh as any).material[eid] > 0;
                if (geoOk && matOk) {
                    if (!hasComponent(world, ThreeResourcesBuilt, eid)) {
                        addComponent(world, ThreeResourcesBuilt, eid);
                    }
                    ThreeResourcesBuilt.built[eid] = 1;
                    builtCount++;
                }
            }

        },
    };
}
