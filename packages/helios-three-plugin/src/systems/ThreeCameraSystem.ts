import { defineQuery, enterQuery, exitQuery } from 'bitecs';
import { System } from "@merlinn/helios-core";
import * as THREE from "three";
import { ThreeCamera, ThreeObject } from "../components";
import { getThreeRenderContext } from "../ThreeRenderContext";
import { clearEntityPickingTag, tagObject3DForEntityPicking } from "../picking/tagThreeObjectForPicking";

export class UpdateThreeCameraSystem extends System {
    static override readonly runsInEditor = true;

    private readonly cameraQuery = defineQuery([ThreeCamera, ThreeObject]);
    private readonly cameraEnter = enterQuery(this.cameraQuery);
    private readonly cameraExit = exitQuery(this.cameraQuery);

    /** (Re)create THREE camera when `ThreeObject.object` is missing or still holds a non-camera placeholder. */
    private ensurePerspectiveCamera(eid: number): void {
        const objectComp = ThreeObject.get(eid);
        if (objectComp.object instanceof THREE.PerspectiveCamera) return;
        if (objectComp.object) {
            clearEntityPickingTag(objectComp.object);
            objectComp.object.removeFromParent();
        }
        const cameraData = ThreeCamera.get(eid);
        const camera = new THREE.PerspectiveCamera(
            cameraData.fov,
            cameraData.aspect,
            cameraData.near,
            cameraData.far
        );
        objectComp.object = camera;
        tagObject3DForEntityPicking(camera, eid);
    }

    update(dt: number): void {
        const world = this.world;
        const renderContext = getThreeRenderContext(this.context);

        this.cameraEnter(world).forEach(eid => {
            this.ensurePerspectiveCamera(eid);
        });

        this.cameraQuery(world).forEach(eid => {
            this.ensurePerspectiveCamera(eid);
            const camera = ThreeObject.get(eid).object;
            if (!(camera instanceof THREE.PerspectiveCamera)) {
                return;
            }
            const canvas = renderContext.getCanvas();
            if (canvas && canvas.width && canvas.height) {
                ThreeCamera.aspect[eid] = canvas.clientWidth / canvas.clientHeight;
            }
            camera.aspect = ThreeCamera.aspect[eid];
            camera.fov = ThreeCamera.fov[eid];
            camera.near = ThreeCamera.near[eid];
            camera.far = ThreeCamera.far[eid];
            camera.updateProjectionMatrix();
            /** Game tab render uses {@link ThreeRenderContext#getActiveCamera}; editor tab ignores it. */
            renderContext.setActiveCamera(camera);
        });

        this.cameraExit(world).forEach(eid => {
            const objectComp = ThreeObject.get(eid);
            if (objectComp.object) {
                // Clear ECS active camera when that entity is removed (both game and editor render views).
                if (renderContext.getActiveCamera() === objectComp.object) {
                    renderContext.setActiveCamera(undefined);
                }
                clearEntityPickingTag(objectComp.object);
                if (objectComp.object.parent) {
                    objectComp.object.parent.remove(objectComp.object);
                }
                ThreeObject.object[eid] = 0;
            }
        });
    }
}
