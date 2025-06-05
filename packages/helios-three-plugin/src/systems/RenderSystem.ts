import * as THREE from 'three';
import {defineQuery, enterQuery, exitQuery, addEntity, addComponent} from "bitecs";
import {Context, Position, System} from "@merlinn/helios-core";
import {ThreeCamera, ThreeObject, ThreeRenderer, ThreeScene} from '../components';
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
            ThreeRenderer.get(0).aspect = canvas.clientWidth / canvas.clientHeight;
        }


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
            this.camera = ThreeObject.get(entity).object as THREE.Camera;
        });

        if (!this.scene || !this.camera || !this.renderer) return;

        this.renderer.render(this.scene, this.camera);

        // console.log(this.scene , this.camera, this.renderer)
        this.sceneExitQuery(this.world).forEach(entity => {
             this.resources.delete(ThreeScene.scene[entity]);
        });

        this.rendererExitQuery(this.world).forEach(entity => {
            this.resources.delete(ThreeRenderer.canvasId[entity]);
            this.resources.delete(ThreeRenderer.renderer[entity]);
        })

        this.cameraExitQuery(this.world).forEach(entity => {
            this.resources.delete(ThreeObject.object[entity]);
        })
    }
}
