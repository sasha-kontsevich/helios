import * as THREE from 'three';
import {defineQuery, enterQuery, exitQuery} from "bitecs";
import {System} from "@merlinn/helios-core";
import {ThreeCamera, ThreeRenderer, ThreeScene} from '../components';

export class RenderSystem extends System {
    private sceneQuery = defineQuery([ThreeScene]);
    private rendererQuery = defineQuery([ThreeRenderer]);
    private cameraQuery = defineQuery([ThreeCamera]);

    private sceneEnterQuery = enterQuery(this.sceneQuery);
    private rendererEnterQuery = enterQuery(this.rendererQuery);
    private cameraEnterQuery = enterQuery(this.cameraQuery);

    private sceneExitQuery = exitQuery(this.sceneQuery);
    private rendererExitQuery = exitQuery(this.rendererQuery);
    private cameraExitQuery = exitQuery(this.cameraQuery);

    private scene?: THREE.Scene;
    private renderer?: THREE.WebGLRenderer;
    private camera?: THREE.Camera;

    update(deltaTime: number) {
        this.sceneEnterQuery(this.world).forEach(entity => {
            const resource = new THREE.Scene();
            ThreeScene.resourceId[entity] = this.resources.set(resource);
        });

        this.rendererEnterQuery(this.world).forEach(entity => {
            const canvasId = this.resources.get<string>(ThreeRenderer.canvasId[entity]);
            const canvas = document.getElementById(canvasId);
            if (canvas) {
                const resource = new THREE.WebGLRenderer({canvas});
                ThreeRenderer.resourceId[entity] = this.resources.set(resource);
            }
        })

        this.cameraEnterQuery(this.world).forEach(entity => {
            const camera = new THREE.PerspectiveCamera(
                ThreeCamera.fov[entity],
                ThreeCamera.aspect[entity],
                ThreeCamera.near[entity],
                ThreeCamera.far[entity]
            );
            ThreeCamera.resourceId[entity] = this.resources.set(camera);
        })


        this.sceneQuery(this.world).forEach(entity => {
            this.scene = this.resources.get<THREE.Scene>(ThreeScene.resourceId[entity]);
        });

        this.rendererQuery(this.world).forEach(entity => {
            this.renderer = this.resources.get<THREE.WebGLRenderer>(ThreeRenderer.resourceId[entity]);
        });

        this.cameraQuery(this.world).forEach(entity => {
            this.camera = this.resources.get<THREE.Camera>(ThreeCamera.resourceId[entity]);
        });

        if (!this.scene || !this.camera || !this.renderer) return;

        this.renderer.render(this.scene, this.camera);


        this.sceneExitQuery(this.world).forEach(entity => {
             this.resources.delete(ThreeScene.resourceId[entity]);
        });

        this.rendererExitQuery(this.world).forEach(entity => {
            this.resources.delete(ThreeRenderer.resourceId[entity]);
            this.resources.delete(ThreeRenderer.canvasId[entity]);
        })

        this.cameraExitQuery(this.world).forEach(entity => {
            this.resources.delete(ThreeCamera.resourceId[entity]);
        })
    }
}
