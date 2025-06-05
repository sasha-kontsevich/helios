import * as THREE from 'three';
import {defineQuery, enterQuery, exitQuery, addEntity, addComponent} from "bitecs";
import {Context, Position, System} from "@merlinn/helios-core";
import {ThreeCamera, ThreeObject, ThreeRenderer, ThreeScene} from '../components';
import {AxesHelper, Color, GridHelper} from "three";

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

    public constructor(context: Context) {
        super(context);
        const eid = addEntity(this.world);
        addComponent(this.world, Position, eid);
        addComponent(this.world, ThreeRenderer, 0);
        addComponent(this.world, ThreeScene, 0);


        ThreeScene.get(0).scene = new THREE.Scene();
        ThreeScene.get(0).scene.background = new THREE.Color(0x3333333);
        const ambientLight = new THREE.AmbientLight(0xffffff, 5); // яркий белый свет
        ThreeScene.get(0).scene.add(ambientLight);

        ThreeRenderer.get(0).canvasId = "three-scene";
        const canvas = document.getElementById(ThreeRenderer.get(0).canvasId) as HTMLCanvasElement;
        if (canvas) {
            ThreeRenderer.get(0).renderer = new THREE.WebGLRenderer({canvas, antialias: true});
            ThreeRenderer.get(0).renderer.setSize(window.innerWidth, window.innerHeight); // физический размер
            ThreeRenderer.get(0).renderer.setPixelRatio(window.devicePixelRatio); // плотность пикселей
            ThreeRenderer.get(0).canvas = canvas;
        }

        const grid = new GridHelper(1000, 1000, new Color(0x666666), new Color(0x444444));
        grid.position.y = -0.001
        ThreeScene.get(0).scene.add(grid);
        ThreeScene.get(0).scene.add(new AxesHelper(2.5));
    }

    update(deltaTime: number) {
        this.sceneQuery(this.world).forEach(entity => {
            this.scene = ThreeScene.get(0).scene;
        });

        this.rendererQuery(this.world).forEach(entity => {
            this.renderer = ThreeRenderer.get(0).renderer;
        });

        this.cameraQuery(this.world).forEach(entity => {
            this.camera = ThreeObject.get(entity).object as THREE.Camera;
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
            this.resources.delete(ThreeObject.object[entity]);
        })
    }
}
