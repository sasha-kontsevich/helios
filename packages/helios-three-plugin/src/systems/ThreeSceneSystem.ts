import {defineQuery, enterQuery, exitQuery} from "bitecs";
import { System} from "@merlinn/helios-core";
import {ThreeObject, ThreeScene} from '../components';
import * as THREE from "three";

export class ThreeSceneSystem extends System {
    private query = defineQuery([ThreeObject]);
    private enterQuery = enterQuery(this.query);
    private exitQuery = exitQuery(this.query);

    update(deltaTime: number) {
        const scene = ThreeScene.get(0).scene;
        if (!scene) return;

        this.enterQuery(this.world).forEach(entity => {

        });

        this.query(this.world).forEach(entity => {
            const object = ThreeObject.get(entity).object;
            // console.log(scene)
            if(object instanceof THREE.Object3D && !scene.getObjectById(object.id)) {
                scene.add(ThreeObject.get(entity).object);
            }
        });

        this.exitQuery(this.world).forEach(entity => {
            const object = ThreeObject.get(entity).object;
            if(object instanceof THREE.Object3D) {
                scene.remove(ThreeObject.get(entity).object)
            }
        })
    }
}
