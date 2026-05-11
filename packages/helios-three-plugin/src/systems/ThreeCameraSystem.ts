import { addComponent, addEntity, defineQuery, enterQuery, exitQuery } from 'bitecs';
import { Position, Rotation, System } from "@merlinn/helios-core";
import * as THREE from "three";
import { ThreeCamera, ThreeObject } from "../components";
import { getThreeRenderContext } from "../ThreeRenderContext";

export class UpdateThreeCameraSystem extends System {
    private readonly cameraQuery = defineQuery([ThreeCamera, ThreeObject]);
    private readonly cameraEnter = enterQuery(this.cameraQuery);
    private readonly cameraExit = exitQuery(this.cameraQuery);
    /** If any camera exists (e.g. loaded from a scene asset), skip default bootstrap. */
    private readonly anyThreeCameraQuery = defineQuery([ThreeCamera]);

    async start(): Promise<void> {
        if (this.anyThreeCameraQuery(this.world).length > 0) {
            return;
        }

        const eid = addEntity(this.world);
        const initialPosition = new THREE.Vector3(3.3, 3.0, 3.4);
        const bootstrapCamera = new THREE.PerspectiveCamera();

        bootstrapCamera.position.copy(initialPosition);
        bootstrapCamera.lookAt(0, 0, 0);

        addComponent(this.world, ThreeCamera, eid);
        addComponent(this.world, ThreeObject, eid);
        addComponent(this.world, Position, eid);
        addComponent(this.world, Rotation, eid);

        ThreeCamera.fov[eid] = 70;
        ThreeCamera.aspect[eid] = 1.3;
        ThreeCamera.near[eid] = 0.1;
        ThreeCamera.far[eid] = 1000;

        Position.x[eid] = initialPosition.x;
        Position.y[eid] = initialPosition.y;
        Position.z[eid] = initialPosition.z;

        Rotation.x[eid] = bootstrapCamera.rotation.x;
        Rotation.y[eid] = bootstrapCamera.rotation.y;
        Rotation.z[eid] = bootstrapCamera.rotation.z;
    }

    update(dt: number): void {
        const world = this.world;
        const renderContext = getThreeRenderContext(this.context);

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
            const canvas = renderContext.getCanvas();
            if (canvas && canvas.width && canvas.height) {
                ThreeCamera.aspect[eid] = canvas.clientWidth / canvas.clientHeight;
            }
            camera.aspect = ThreeCamera.aspect[eid];
            camera.fov = ThreeCamera.fov[eid];
            camera.near = ThreeCamera.near[eid];
            camera.far = ThreeCamera.far[eid];
            camera.updateProjectionMatrix();
            if (renderContext.getRenderView() === "game") {
                renderContext.setActiveCamera(camera);
            }
        });

        this.cameraExit(world).forEach(eid => {
            const objectComp = ThreeObject.get(eid);
            if (objectComp.object) {
                // Clear ECS active camera when that entity is removed (both game and editor render views).
                if (renderContext.getActiveCamera() === objectComp.object) {
                    renderContext.setActiveCamera(undefined);
                }
                if (objectComp.object.parent) {
                    objectComp.object.parent.remove(objectComp.object);
                }
                ThreeObject.object[eid] = 0;
            }
        });
    }
}
