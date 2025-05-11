import { createWorld, IWorld } from 'bitecs';
import { Engine } from './index';
import { ResourceManager } from './index';
import { SystemManager } from './index';
import { ComponentManager } from "./index";
import { PluginManager } from "./index";
import { AssetDatabase } from "./index";
import { PrefabManager } from "./index";
import { AssetManager } from "./index";
import { SceneManager } from "./index";

export class Context {
    readonly engine: Engine;
    readonly ecsWorld: IWorld;
    readonly plugins: PluginManager;
    readonly resources: ResourceManager;
    readonly components: ComponentManager;
    readonly systems: SystemManager;
    readonly prefabs: PrefabManager;
    readonly assetDatabase: AssetDatabase;
    readonly assetManager: AssetManager;
    readonly scenes: SceneManager;

    // Можно добавить сюда время, конфиг, дебаг-флаги и т.п. позже

    constructor(engine: Engine) {
        this.engine = engine;
        this.ecsWorld = createWorld();
        this.plugins = new PluginManager(this);
        this.resources = new ResourceManager();
        this.components = new ComponentManager();
        this.systems = new SystemManager(this);
        this.prefabs = new PrefabManager(this);
        this.assetDatabase = new AssetDatabase();
        this.assetManager = new AssetManager(this);
        this.scenes = new SceneManager(this);
    }
}
