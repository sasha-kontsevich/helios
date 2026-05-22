import { defineQuery, enterQuery, entityExists, exitQuery, hasComponent } from "bitecs";
import { Parent, Position, Rotation, Scale, System } from "@merlinn/helios-core";
import type { IWorld } from "bitecs";
import * as THREE from "three";
import { ThreeMesh, ThreeObject } from "../components";
import { ensureGeometryUv2FromUv } from "../assets/geometryUv";
import { removeStaleTaggedObjectsForEntity, setEntityThreeObject } from "../entityThreeObject";
import { getThreeRenderContext } from "../ThreeRenderContext";
import { clearEntityPickingTag } from "../picking/tagThreeObjectForPicking";

/** Apply ECS transform before the mesh enters the scene graph (avoids one-frame flash at scale 1). */
function syncMeshTransformFromEcs(world: IWorld, eid: number, object: THREE.Object3D): void {
    if (hasComponent(world, Position, eid)) {
        object.position.set(Position.x[eid], Position.y[eid], Position.z[eid]);
    }
    if (hasComponent(world, Rotation, eid)) {
        object.quaternion.set(
            Rotation.x[eid],
            Rotation.y[eid],
            Rotation.z[eid],
            Rotation.w[eid],
        );
    }
    if (hasComponent(world, Scale, eid)) {
        object.scale.set(Scale.x[eid], Scale.y[eid], Scale.z[eid]);
    }
    if (hasComponent(world, Parent, eid)) {
        const parentEid = Parent.target[eid];
        if (parentEid > 0) {
            const parentObject = ThreeObject.get(parentEid).object;
            if (parentObject && object.parent !== parentObject) {
                parentObject.add(object);
                Parent.current[eid] = parentEid;
            }
        }
    }
}

export class UpdateThreeMeshSystem extends System {
    static override readonly systemName = "UpdateThreeMeshSystem";
    static override readonly systemDescription =
        "Creates and updates Three.js meshes from ThreeMesh and resources.";
    static override readonly runsInEditor = true;

    private readonly meshQuery = defineQuery([ThreeObject, ThreeMesh]);
    private readonly meshEnter = enterQuery(this.meshQuery);
    private readonly meshExit = exitQuery(this.meshQuery);
    private readonly lastResolvedResources = new Map<number, { geometry: number; material: number }>();

    private attachMeshToEntity(eid: number, mesh: THREE.Mesh): void {
        ensureGeometryUv2FromUv(mesh.geometry);
        syncMeshTransformFromEcs(this.world, eid, mesh);
        const root = getThreeRenderContext(this.context).getWorldRoot();
        setEntityThreeObject(root, eid, mesh);
    }

    update(dt: number): void {
        const world = this.world;

        // Сначала выходы: иначе в одном кадре enter + exit по одному eid сначала создаст меш,
        // а meshExit ниже снимет его и обнулит ThreeObject (меш «пропадает» без явной ошибки).
        const worldRoot = getThreeRenderContext(this.context).getWorldRoot();
        this.meshExit(world).forEach((eid) => {
            this.lastResolvedResources.delete(eid);
            if (!entityExists(world as any, eid)) {
                return;
            }
            const objectComponent = ThreeObject.get(eid);
            const object = objectComponent.object as THREE.Object3D | undefined;
            if (object) {
                clearEntityPickingTag(object);
                object.removeFromParent();
                ThreeObject.object[eid] = 0;
            }
            removeStaleTaggedObjectsForEntity(worldRoot, eid);
        });

        // Новые сущности — создаём THREE.Mesh (только когда ресурсы готовы)
        this.meshEnter(world).forEach(eid => {
            const objectComponent = ThreeObject.get(eid);

            if (objectComponent.object) return;
            const geoId = (ThreeMesh as any).geometry?.[eid] as number | undefined;
            const matId = (ThreeMesh as any).material?.[eid] as number | undefined;
            if (!geoId || !matId) return;

            const geometry = this.context.resources.get<THREE.BufferGeometry>(geoId);
            const material = this.context.resources.get<THREE.Material>(matId);
            const mesh = new THREE.Mesh(geometry, material);
            this.attachMeshToEntity(eid, mesh);
        });

        // Fallback: если сущность вошла в query до резолва ресурсов билдерами — создаём позже.
        this.meshQuery(world).forEach(eid => {
            const objectComponent = ThreeObject.get(eid);
            const geoId = (ThreeMesh as any).geometry?.[eid] as number | undefined;
            const matId = (ThreeMesh as any).material?.[eid] as number | undefined;
            if (!geoId || !matId) return;

            const obj = objectComponent.object;
            if (obj instanceof THREE.Mesh) {
                const prev = this.lastResolvedResources.get(eid);
                if (!prev || prev.geometry !== geoId || prev.material !== matId) {
                    const geo = this.context.resources.get<THREE.BufferGeometry>(geoId);
                    ensureGeometryUv2FromUv(geo);
                    obj.geometry = geo;
                    obj.material = this.context.resources.get<THREE.Material>(matId);
                }
                this.lastResolvedResources.set(eid, { geometry: geoId, material: matId });
                return;
            }

            if (obj) return;

            const geometry = this.context.resources.get<THREE.BufferGeometry>(geoId);
            const material = this.context.resources.get<THREE.Material>(matId);
            const mesh = new THREE.Mesh(geometry, material);
            this.attachMeshToEntity(eid, mesh);
            this.lastResolvedResources.set(eid, { geometry: geoId, material: matId });
        });

    }
}
