import {Context, ISystem} from "@merlinn/helios-core";
import {addComponent, addEntity, defineQuery} from "bitecs";
import {Fps} from "../components";

export class TestSystem implements ISystem {
    private readonly fpsEntity;
    private readonly Fps;
    private readonly query;

    constructor(context: Context) {
        this.fpsEntity = addEntity(context.ecsWorld)
        this.Fps = context.components.get('Fps');
        addComponent(context.ecsWorld, this.Fps, this.fpsEntity);
        this.query  = defineQuery([this.Fps]);
    }

    update(context: Context, deltaTime: number): void {
        const eids = this.query(context.ecsWorld);
        eids.forEach((eid) => {
            this.Fps.rawValue[eid] = this.getFps(deltaTime)
        })
        console.log('context:', this.Fps.rawValue[this.fpsEntity].toFixed(),'import', Fps.rawValue[this.fpsEntity].toFixed())
    }

    getFps(deltaTime: number) {
        return (1/deltaTime);
    }
}
