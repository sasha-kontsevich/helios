import {addComponent, addEntity, defineQuery, enterQuery, exitQuery} from 'bitecs';
import {Context, Parent, Position, Rotation, System} from "@merlinn/helios-core";
import * as THREE from "three";
import {ThreeCamera, ThreeObject, ThreeRenderer, ThreeScene} from "../components";
import {Quaternion} from "three";

export class UpdateThreeCameraSystem extends System {
    private readonly cameraQuery = defineQuery([ThreeCamera, ThreeObject]);
    private readonly cameraEnter = enterQuery(this.cameraQuery);
    private readonly cameraExit = exitQuery(this.cameraQuery);

    public constructor(context: Context) {
        super(context);

        const eid = addEntity(this.world)

        addComponent(this.world, ThreeCamera, eid);
        addComponent(this.world, ThreeObject, eid);
        addComponent(this.world, Position, eid);
        addComponent(this.world, Rotation, eid);
        addComponent(this.world, Parent, eid);

        ThreeCamera.fov[eid] = 70;
        ThreeCamera.aspect[eid] = 1.3;
        ThreeCamera.near[eid] = 0.1;
        ThreeCamera.far[eid] = 1000;

        Position.x[eid] = 3.3;
        Position.y[eid] = 3.0;
        Position.z[eid] = 3.4;

        Rotation.y[eid] = 0.3;
        Rotation.x[eid] = -0.8;

        Parent.target[eid] = 0;
    }

    update(dt: number): void {
        const world = this.world;

        this.cameraEnter(world).forEach(eid => {
            const cameraData = ThreeCamera.get(eid);
            const objectComp = ThreeObject.get(eid);
            if (!objectComp.object) {
                objectComp.object = new THREE.PerspectiveCamera(
                    cameraData.fov,
                    cameraData.aspect,
                    cameraData.near,
                    cameraData.far
                );
            }
        });

        this.cameraQuery(world).forEach(eid => {

            const camera = ThreeObject.get(eid).object as THREE.PerspectiveCamera;
            const canvas = ThreeRenderer.get(0).canvas;
            if (canvas && canvas.width && canvas.height) {
                ThreeCamera.aspect[eid] = canvas.clientWidth / canvas.clientHeight;
            }
            camera.aspect = ThreeCamera.aspect[eid];
            camera.fov = ThreeCamera.fov[eid];
            camera.near = ThreeCamera.near[eid];
            camera.far = ThreeCamera.far[eid];
            camera.updateProjectionMatrix();
            camera.lookAt(0,0,0);
        })

        this.cameraExit(world).forEach(eid => {
            const objectComp = ThreeObject.get(eid);
            if (objectComp.object) {
                if (objectComp.object.parent) {
                    objectComp.object.parent.remove(objectComp.object);
                }
                objectComp.object = null;
            }
        });
    }
}
