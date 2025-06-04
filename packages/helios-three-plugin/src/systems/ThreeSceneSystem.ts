import {defineQuery, enterQuery, exitQuery} from "bitecs";
import { System} from "@merlinn/helios-core";
import {ThreeCamera, ThreeLight, ThreeMesh, ThreeScene} from '../components';

export class ThreeSceneSystem extends System {
    private cameraQuery = defineQuery([ThreeCamera]);
    private meshQuery = defineQuery([ThreeMesh]);
    private lightQuery = defineQuery([ThreeLight]);

    private cameraEnterQuery = enterQuery(this.cameraQuery);
    private meshEnterQuery = enterQuery(this.meshQuery);
    private lightEnterQuery= exitQuery(this.lightQuery);

    private cameraExitQuery = exitQuery(this.cameraQuery);
    private meshExitQuery = exitQuery(this.meshQuery);
    private lightExitQuery = exitQuery(this.lightQuery);

    update(deltaTime: number) {
        const scene = ThreeScene.get(0).scene;
        if (!scene) return;

        this.cameraEnterQuery(this.world).forEach(entity => {
            scene.add(ThreeCamera.get(entity).camera);
        });

        this.meshEnterQuery(this.world).forEach(entity => {
            scene.add(ThreeMesh.get(entity).mesh);
        });

        this.lightEnterQuery(this.world).forEach(entity => {
            scene.add(ThreeLight.get(entity).light);
        });

        this.cameraExitQuery(this.world).forEach(entity => {
             scene.remove(ThreeCamera.get(entity).camera)
        });

        this.meshExitQuery(this.world).forEach(entity => {
            scene.remove(ThreeMesh.get(entity).mesh)
        })

        this.lightExitQuery(this.world).forEach(entity => {
            scene.remove(ThreeLight.get(entity).light)
        })
    }
}
