import * as THREE from 'three';
import {defineQuery} from "bitecs";
import {Context, ISystem} from "@merlinn/helios-core";

export class RenderSystem implements ISystem {
    private sceneQuery;
    private rendererQuery;
    private cameraQuery;

    private scene?: THREE.Scene;
    private renderer?: THREE.WebGLRenderer;
    private camera?: THREE.Camera;

    private ThreeScene;
    private ThreeRenderer;
    private ThreeCamera;

    constructor(context: Context) {
        this.ThreeScene = context.components.get("ThreeScene");
        this.ThreeRenderer = context.components.get("ThreeRenderer");
        this.ThreeCamera = context.components.get("ThreeCamera");

        this.sceneQuery = defineQuery([this.ThreeScene]);
        this.rendererQuery = defineQuery([this.ThreeRenderer]);
        this.cameraQuery = defineQuery([this.ThreeCamera]);
    }

    update(context: Context, deltaTime: number) {
        this.sceneQuery(context.ecsWorld).forEach(entity => {
            this.scene = context.resources.get<THREE.Scene>(this.ThreeScene.resourceId[entity])
        });

        this.rendererQuery(context.ecsWorld).forEach(entity => {
            this.renderer = context.resources.get<THREE.WebGLRenderer>(this.ThreeRenderer.resourceId[entity])
        });

        this.cameraQuery(context.ecsWorld).forEach(entity => {
            this.camera = context.resources.get<THREE.Camera>(this.ThreeCamera.resourceId[entity])
        });

        if (!this.scene || !this.camera || !this.renderer) return;

        this.renderer.render(this.scene, this.camera);
    }
}
