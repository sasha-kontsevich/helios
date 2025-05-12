import * as THREE from 'three';
import {RenderSystem} from "./systems/RenderSystem";
import {ThreeMesh} from "./components";
import {Context, IPlugin} from "@merlinn/helios-core";

interface ThreePluginOptions {
    canvasContainer: HTMLElement;
}

export class ThreePlugin implements IPlugin {

    public name: string = 'Three';
    private readonly options: ThreePluginOptions;

    constructor(options: ThreePluginOptions) {
        this.options = options;
    }

    async setup(context: Context) {
        const { canvasContainer } = this.options;

        // Инициализируем THREE объекты ВЫНЕСТИ В БИЛДЕР
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 2, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        canvasContainer.appendChild(renderer.domElement);

        // Регистрируем компонент
        context.components.register('ThreeMesh', ThreeMesh);

        // Регистрируем систему
        context.systems.register(new RenderSystem(context));
    }
}
