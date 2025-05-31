import {Plugin, Context} from "@merlinn/helios-core";

interface ThreePluginOptions {
    canvasContainer: HTMLElement|null;
}

export class ThreePlugin extends Plugin {

    public name: string = 'Three';
    private readonly options: ThreePluginOptions;

    constructor(options: ThreePluginOptions) {
        super();
        this.options = options;
    }

    public setup() {
        // const { canvasContainer } = this.options;
        //
        // // Инициализируем THREE объекты ВЫНЕСТИ В БИЛДЕР
        // const scene = new THREE.Scene();
        // const camera = new THREE.PerspectiveCamera(75, 2, 0.1, 1000);
        // const renderer = new THREE.WebGLRenderer();
        // canvasContainer.appendChild(renderer.domElement);

    }
}
