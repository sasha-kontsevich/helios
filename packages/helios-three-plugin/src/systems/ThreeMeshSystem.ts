import {defineQuery, enterQuery, entityExists, exitQuery} from 'bitecs';
import {System} from "@merlinn/helios-core";
import * as THREE from "three";
import {ThreeMesh, ThreeObject} from "../components";
import { clearEntityPickingTag, tagObject3DForEntityPicking } from "../picking/tagThreeObjectForPicking";

export class UpdateThreeMeshSystem extends System {
    static override readonly runsInEditor = true;

    private readonly meshQuery = defineQuery([ThreeObject, ThreeMesh]);
    private readonly meshEnter = enterQuery(this.meshQuery);
    private readonly meshExit = exitQuery(this.meshQuery);

    update(dt: number): void {
        const world = this.world;

        // Сначала выходы: иначе в одном кадре enter + exit по одному eid сначала создаст меш,
        // а meshExit ниже снимет его и обнулит ThreeObject (меш «пропадает» без явной ошибки).
        this.meshExit(world).forEach((eid) => {
            if (!entityExists(world as any, eid)) {
                return;
            }
            const objectComponent = ThreeObject.get(eid);
            if (objectComponent.object) {
                const object = objectComponent.object;
                clearEntityPickingTag(object);
                if (object.parent) {
                    object.parent.remove(object); // удалить из сцены, если есть
                }
                if (object instanceof THREE.Mesh) {
                    object.geometry.dispose?.();
                    object.material.dispose?.();
                }
                ThreeObject.object[eid] = 0;
            }
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
            objectComponent.object = mesh;
            tagObject3DForEntityPicking(mesh, eid);
        });

        // Fallback: если сущность вошла в query до резолва ресурсов билдерами — создаём позже.
        this.meshQuery(world).forEach(eid => {
            const objectComponent = ThreeObject.get(eid);
            if (objectComponent.object) return;

            const geoId = (ThreeMesh as any).geometry?.[eid] as number | undefined;
            const matId = (ThreeMesh as any).material?.[eid] as number | undefined;
            if (!geoId || !matId) return;

            const geometry = this.context.resources.get<THREE.BufferGeometry>(geoId);
            const material = this.context.resources.get<THREE.Material>(matId);
            const mesh = new THREE.Mesh(geometry, material);
            objectComponent.object = mesh;
            tagObject3DForEntityPicking(mesh, eid);
        });

        // Основной апдейт — можно позже добавить перемещения и т.п.
        // this.meshQuery(world).forEach(...) — сейчас не нужен
    }
}
