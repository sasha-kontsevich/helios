import {defineQuery, enterQuery, exitQuery} from 'bitecs';
import {System} from "@merlinn/helios-core";
import * as THREE from "three";
import {ThreeMesh, ThreeObject} from "../components";

export class UpdateThreeMeshSystem extends System {
    private readonly meshQuery = defineQuery([ThreeObject, ThreeMesh]);
    private readonly meshEnter = enterQuery(this.meshQuery);
    private readonly meshExit = exitQuery(this.meshQuery);

    update(dt: number): void {
        const world = this.world;

        // Новые сущности — создаём THREE.Mesh
        this.meshEnter(world).forEach(eid => {
            const meshComponent = ThreeMesh.get(eid);
            const objectComponent = ThreeObject.get(eid);

            if (!objectComponent.object) {
                objectComponent.object = new THREE.Mesh(meshComponent.geometry, meshComponent.material);
            }
        });

        // Удалённые сущности — очищаем
        this.meshExit(world).forEach(eid => {
            const objectComponent = ThreeObject.get(eid);
            if (objectComponent.object) {
                const object = objectComponent.object;
                if (object.parent) {
                    object.parent.remove(object); // удалить из сцены, если есть
                }
                if (object instanceof THREE.Mesh) {
                    object.geometry.dispose?.();
                    object.material.dispose?.();
                }
                objectComponent.object = null;
            }
        });

        // Основной апдейт — можно позже добавить перемещения и т.п.
        // this.meshQuery(world).forEach(...) — сейчас не нужен
    }
}
