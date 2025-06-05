import * as THREE from 'three';
import {defineQuery, enterQuery, exitQuery, addEntity, addComponent} from "bitecs";
import {Context, Position, System} from "@merlinn/helios-core";
import {ThreeCamera, ThreeRenderer, ThreeScene} from '../components';
import {AxesHelper} from "three";

export class RenderSystem extends System {
    private sceneQuery = defineQuery([ThreeScene]);
    private rendererQuery = defineQuery([ThreeRenderer]);
    private cameraQuery = defineQuery([ThreeCamera]);

    private sceneExitQuery = exitQuery(this.sceneQuery);
    private rendererExitQuery = exitQuery(this.rendererQuery);
    private cameraExitQuery = exitQuery(this.cameraQuery);

    private scene?: THREE.Scene;
    private renderer?: THREE.WebGLRenderer;
    private camera?: THREE.Camera;

    private readonly threeEid;

    public constructor(context: Context) {
        super(context);
        this.threeEid = addEntity(this.world);
        addComponent(this.world, ThreeCamera, this.threeEid);
        addComponent(this.world, Position, this.threeEid);
        addComponent(this.world, ThreeRenderer, 0);
        addComponent(this.world, ThreeScene, 0);


        ThreeScene.get(0).scene = new THREE.Scene();
        ThreeRenderer.get(0).canvasId = "three-scene";
        const canvas = document.getElementById(ThreeRenderer.get(0).canvasId);
        if (canvas) {
            ThreeRenderer.get(0).renderer = new THREE.WebGLRenderer({canvas, antialias: true});
            ThreeRenderer.get(0).renderer.setSize(window.innerWidth, window.innerHeight); // физический размер
            ThreeRenderer.get(0).renderer.setPixelRatio(window.devicePixelRatio); // плотность пикселей
            ThreeCamera.get(this.threeEid).camera = new THREE.PerspectiveCamera(70, canvas.clientWidth / canvas.clientHeight, 0.01, 1000);
        }
        ThreeCamera.get(this.threeEid).camera.position.set(2, 2, 5);
        ThreeCamera.get(this.threeEid).camera.rotation.y = 0.3;
        ThreeCamera.get(this.threeEid).camera.rotation.x = -0.3;

        ThreeScene.get(0).scene.add(new AxesHelper(3));
    }

    update(deltaTime: number) {
        this.sceneQuery(this.world).forEach(entity => {
            this.scene = ThreeScene.get(entity).scene;
        });

        this.rendererQuery(this.world).forEach(entity => {
            this.renderer = ThreeRenderer.get(entity).renderer;
        });

        this.cameraQuery(this.world).forEach(entity => {
            this.camera = ThreeCamera.get(entity).camera;
        });

        if (!this.scene || !this.camera || !this.renderer) return;

        this.renderer.render(this.scene, this.camera);

        this.sceneExitQuery(this.world).forEach(entity => {
             this.resources.delete(ThreeScene.scene[entity]);
        });

        this.rendererExitQuery(this.world).forEach(entity => {
            this.resources.delete(ThreeRenderer.canvasId[entity]);
            this.resources.delete(ThreeRenderer.renderer[entity]);
        })

        this.cameraExitQuery(this.world).forEach(entity => {
            this.resources.delete(ThreeCamera.camera[entity]);
        })
    }
}
