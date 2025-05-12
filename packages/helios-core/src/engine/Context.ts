import { createWorld, IWorld } from 'bitecs';
import {Engine} from "./Engine";
import {PluginManager} from "./PluginManager";
import {ResourceManager} from "./ResourceManager";
import {ComponentManager} from "./ComponentManager";
import {SystemManager} from "./SystemManager";
import {PrefabManager} from "./PrefabManager";
import {AssetDatabase} from "./AssetDatabase";
import {AssetManager} from "./AssetManager";
import {SceneManager} from "./SceneManager";
import {BuilderManger} from "./BuilderManger";

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
    readonly builders: BuilderManger;

    constructor(engine: Engine) {
        this.engine = engine;
        this.ecsWorld = createWorld();
        this.components = new ComponentManager();
        this.systems = new SystemManager(this);
        this.resources = new ResourceManager();
        this.plugins = new PluginManager(this);
        this.prefabs = new PrefabManager(this);
        this.assetDatabase = new AssetDatabase();
        this.assetManager = new AssetManager(this);
        this.scenes = new SceneManager(this);
        this.builders = new BuilderManger();
    }
}
