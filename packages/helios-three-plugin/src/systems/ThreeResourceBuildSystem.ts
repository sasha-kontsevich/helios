import { addComponent, defineQuery, hasComponent } from "bitecs";
import { Geometry, Material, Mesh, System } from "@merlinn/helios-core";
import { parseGeometryDescriptor, parseMaterialDescriptor } from "@merlinn/helios-core";
import * as THREE from "three";
import {
    createGeometryFromDescriptor,
    createMaterialFromDescriptor,
} from "../builders/descriptors";
import { MeshResourcesResolved, ThreeMesh, ThreeObject } from "../components";

function resolveRefField(
    ctx: { resources: { getOrNot(id: number): unknown } },
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
 * Per-frame resolver for editor-created entities.
 * Turns core {@link Geometry} / {@link Material} into runtime resources on {@link ThreeMesh}.
 */
export class ThreeResourceBuildSystem extends System {
    static override readonly runsInEditor = true;

    private readonly query = defineQuery([Mesh, Geometry, Material, ThreeObject]);

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
            }

            const geoGuidId = needsGeometry ? (Geometry.guid[eid] ?? 0) : 0;
            const geoDescId = needsGeometry ? (Geometry.descriptor[eid] ?? 0) : 0;
            const matGuidId = needsMaterial ? (Material.guid[eid] ?? 0) : 0;
            const matDescId = needsMaterial ? (Material.descriptor[eid] ?? 0) : 0;

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

                const obj = ThreeObject.get(eid).object;
                if (obj) {
                    obj.parent?.remove(obj);
                    if (obj instanceof THREE.Mesh) {
                        obj.geometry.dispose?.();
                        (obj.material as THREE.Material)?.dispose?.();
                    }
                    ThreeObject.object[eid] = 0;
                }
            }

            if (MeshResourcesResolved.built[eid] === 1) {
                continue;
            }

            if (needsGeometry && (ThreeMesh.geometry[eid] ?? 0) === 0) {
                const guid = resolveRefField(this.context, Geometry, eid, "guid");
                const descRaw = resolveRefField(this.context, Geometry, eid, "descriptor");

                if (guid && typeof guid === "string" && guid.length > 0) {
                    if (this.context.assetManager.hasAsset(guid)) {
                        const rid = this.context.assetManager.getResourceId(guid);
                        const loaded = this.context.resources.get<unknown>(rid);
                        if (loaded instanceof THREE.BufferGeometry) {
                            ThreeMesh.geometry[eid] = this.context.resources.set(loaded);
                        }
                    }
                } else {
                    const parsed = parseGeometryDescriptor(descRaw);
                    if (parsed) {
                        const geo = createGeometryFromDescriptor(parsed);
                        if (geo) {
                            ThreeMesh.geometry[eid] = this.context.resources.set(geo);
                        } else {
                            console.warn(`[ThreeResourceBuildSystem] Invalid geometry descriptor eid=${eid}`, descRaw);
                        }
                    } else if (descRaw !== undefined && descRaw !== null) {
                        console.warn(`[ThreeResourceBuildSystem] Unsupported geometry descriptor eid=${eid}`, descRaw);
                    }
                }
            }

            if (needsMaterial && (ThreeMesh.material[eid] ?? 0) === 0) {
                const guid = resolveRefField(this.context, Material, eid, "guid");
                const descRaw = resolveRefField(this.context, Material, eid, "descriptor");

                if (guid && typeof guid === "string" && guid.length > 0) {
                    if (this.context.assetManager.hasAsset(guid)) {
                        const rid = this.context.assetManager.getResourceId(guid);
                        const loaded = this.context.resources.get<unknown>(rid);
                        if (loaded instanceof THREE.Material) {
                            ThreeMesh.material[eid] = this.context.resources.set(loaded);
                        }
                    }
                } else {
                    const parsed = parseMaterialDescriptor(descRaw);
                    if (parsed) {
                        const mat = createMaterialFromDescriptor(parsed);
                        if (mat) {
                            ThreeMesh.material[eid] = this.context.resources.set(mat);
                        } else {
                            console.warn(`[ThreeResourceBuildSystem] Invalid material descriptor eid=${eid}`, descRaw);
                        }
                    } else if (descRaw !== undefined && descRaw !== null) {
                        console.warn(`[ThreeResourceBuildSystem] Unsupported material descriptor eid=${eid}`, descRaw);
                    }
                }
            }

            const geoOk = !needsGeometry || ThreeMesh.geometry[eid] > 0;
            const matOk = !needsMaterial || ThreeMesh.material[eid] > 0;
            if (geoOk && matOk) {
                MeshResourcesResolved.built[eid] = 1;
            }
        }
    }
}
