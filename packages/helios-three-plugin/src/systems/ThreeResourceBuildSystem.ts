import { addComponent, defineQuery, hasComponent } from 'bitecs';
import { System } from '@merlinn/helios-core';
import * as THREE from 'three';
import {
    createGeometryFromDescriptor,
    createMaterialFromDescriptor,
    parseGeometryDescriptor,
    parseMaterialDescriptor,
} from '../builders/descriptors';
import {
    ThreeGeometryRef,
    ThreeMaterialRef,
    ThreeMesh,
    ThreeObject,
    ThreeResourcesBuilt,
} from '../components';

function resolveRefField(
    ctx: any,
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
 * Per-frame resolver for editor-created entities.
 * Turns `ThreeGeometryRef`/`ThreeMaterialRef` into runtime resources on `ThreeMesh`.
 */
export class ThreeResourceBuildSystem extends System {
    static override readonly runsInEditor = true;

    private readonly query = defineQuery([ThreeMesh, ThreeObject]);

    update(): void {
        const world = this.world;

        for (const eid of this.query(world)) {
            const needsGeometry = hasComponent(world, ThreeGeometryRef, eid);
            const needsMaterial = hasComponent(world, ThreeMaterialRef, eid);
            if (!needsGeometry && !needsMaterial) continue;

            if (!hasComponent(world, ThreeResourcesBuilt, eid)) {
                addComponent(world, ThreeResourcesBuilt, eid);
            }

            const geoGuidId = needsGeometry ? ((ThreeGeometryRef as any).guid?.[eid] ?? 0) : 0;
            const geoDescId = needsGeometry ? ((ThreeGeometryRef as any).descriptor?.[eid] ?? 0) : 0;
            const matGuidId = needsMaterial ? ((ThreeMaterialRef as any).guid?.[eid] ?? 0) : 0;
            const matDescId = needsMaterial ? ((ThreeMaterialRef as any).descriptor?.[eid] ?? 0) : 0;

            const changed =
                (needsGeometry &&
                    (ThreeResourcesBuilt.geoGuidId[eid] !== geoGuidId ||
                        ThreeResourcesBuilt.geoDescId[eid] !== geoDescId)) ||
                (needsMaterial &&
                    (ThreeResourcesBuilt.matGuidId[eid] !== matGuidId ||
                        ThreeResourcesBuilt.matDescId[eid] !== matDescId));

            if (changed) {
                ThreeResourcesBuilt.built[eid] = 0;
                ThreeResourcesBuilt.geoGuidId[eid] = geoGuidId;
                ThreeResourcesBuilt.geoDescId[eid] = geoDescId;
                ThreeResourcesBuilt.matGuidId[eid] = matGuidId;
                ThreeResourcesBuilt.matDescId[eid] = matDescId;

                // Clear runtime mesh/object so it can be recreated with new resources.
                (ThreeMesh as any).geometry[eid] = 0;
                (ThreeMesh as any).material[eid] = 0;

                const obj = ThreeObject.get(eid).object;
                if (obj) {
                    obj.parent?.remove(obj);
                    if (obj instanceof THREE.Mesh) {
                        obj.geometry.dispose?.();
                        // material can be array, but our builder uses single material
                        (obj.material as any)?.dispose?.();
                    }
                    (ThreeObject as any).object[eid] = 0;
                }
            }

            if (ThreeResourcesBuilt.built[eid] === 1) {
                continue;
            }

            // Resolve geometry
            if (needsGeometry && ((ThreeMesh as any).geometry?.[eid] ?? 0) === 0) {
                const guid = resolveRefField(this.context, ThreeGeometryRef as any, eid, 'guid');
                const descRaw = resolveRefField(this.context, ThreeGeometryRef as any, eid, 'descriptor');

                if (guid && typeof guid === 'string' && guid.length > 0) {
                    if (this.context.assetManager.hasAsset(guid)) {
                        const rid = this.context.assetManager.getResourceId(guid);
                        const loaded = this.context.resources.get<unknown>(rid);
                        if (loaded instanceof THREE.BufferGeometry) {
                            (ThreeMesh as any).geometry[eid] = this.context.resources.set(loaded);
                        }
                    }
                } else {
                    const parsed = parseGeometryDescriptor(descRaw);
                    if (parsed) {
                        const geo = createGeometryFromDescriptor(parsed);
                        if (geo) {
                            (ThreeMesh as any).geometry[eid] = this.context.resources.set(geo);
                        } else {
                            console.warn(`[ThreeResourceBuildSystem] Invalid geometry descriptor eid=${eid}`, descRaw);
                        }
                    } else if (descRaw !== undefined && descRaw !== null) {
                        console.warn(`[ThreeResourceBuildSystem] Unsupported geometry descriptor eid=${eid}`, descRaw);
                    }
                }
            }

            // Resolve material
            if (needsMaterial && ((ThreeMesh as any).material?.[eid] ?? 0) === 0) {
                const guid = resolveRefField(this.context, ThreeMaterialRef as any, eid, 'guid');
                const descRaw = resolveRefField(this.context, ThreeMaterialRef as any, eid, 'descriptor');

                if (guid && typeof guid === 'string' && guid.length > 0) {
                    if (this.context.assetManager.hasAsset(guid)) {
                        const rid = this.context.assetManager.getResourceId(guid);
                        const loaded = this.context.resources.get<unknown>(rid);
                        if (loaded instanceof THREE.Material) {
                            (ThreeMesh as any).material[eid] = this.context.resources.set(loaded);
                        }
                    }
                } else {
                    const parsed = parseMaterialDescriptor(descRaw);
                    if (parsed) {
                        const mat = createMaterialFromDescriptor(parsed);
                        if (mat) {
                            (ThreeMesh as any).material[eid] = this.context.resources.set(mat);
                        } else {
                            console.warn(`[ThreeResourceBuildSystem] Invalid material descriptor eid=${eid}`, descRaw);
                        }
                    } else if (descRaw !== undefined && descRaw !== null) {
                        console.warn(`[ThreeResourceBuildSystem] Unsupported material descriptor eid=${eid}`, descRaw);
                    }
                }
            }

            const geoOk = !needsGeometry || (ThreeMesh as any).geometry[eid] > 0;
            const matOk = !needsMaterial || (ThreeMesh as any).material[eid] > 0;
            if (geoOk && matOk) {
                ThreeResourcesBuilt.built[eid] = 1;
            }
        }
    }
}
