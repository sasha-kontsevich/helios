import {Context, ISystem} from "@merlinn/helios-core";

export class TestSystem implements ISystem {

    constructor(_context: Context) {

    }

    update(_context: Context, deltaTime: number): void {
        this.logFps(deltaTime)
    }

    logFps(deltaTime: number) {
        console.log((1/deltaTime).toFixed(0));
    }
}
