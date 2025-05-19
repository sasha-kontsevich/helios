import {Context, System} from "@merlinn/helios-core";
import { addComponent, addEntity, defineQuery } from "bitecs";
import { Fps } from "../components";

export class TestSystem extends System {
    private fpsEntity;
    private query = defineQuery([Fps]);

    constructor(context: Context) {
        super(context);

        this.fpsEntity = addEntity(this.world);
        addComponent(this.world, Fps, this.fpsEntity);
    }

    update(deltaTime: number): void {
        const eids = this.query(this.world);
        eids.forEach((eid) => {
            Fps.rawValue[eid] = this.getFps(deltaTime);
        });
        console.log('FPS:', Fps.rawValue[this.fpsEntity].toFixed(), this.fpsEntity);
    }

    private getFps(deltaTime: number) {
        return (1/deltaTime);
    }
}
