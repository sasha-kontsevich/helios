import * as THREE from 'three';
import {defineQuery} from "bitecs";
import {System} from "@merlinn/helios-core";
import {ThreeCamera, ThreeRenderer, ThreeScene} from '../components';

export class RenderSystem extends System {
    private sceneQuery = defineQuery([ThreeScene]);
    private rendererQuery = defineQuery([ThreeRenderer]);
    private cameraQuery = defineQuery([ThreeCamera]);

    private scene?: THREE.Scene;
    private renderer?: THREE.WebGLRenderer;
    private camera?: THREE.Camera;

    update(deltaTime: number) {
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
    }
}
