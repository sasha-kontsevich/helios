import {Context, Position, Rotation, System} from "@merlinn/helios-core";
import { defineQuery } from "bitecs";
import {Rotating} from "../components";
import {ThreeMesh} from "@merlinn/helios-three-plugin";

export class RotatingCubeSystem extends System {
    private query = defineQuery([Rotation, ThreeMesh, Rotating, Position]);

    constructor(context: Context) {
        super(context);
    }

    update(deltaTime: number): void {
        this.query(this.world).forEach((eid) => {
            Rotation.y[eid] += Rotating.speed[eid] * deltaTime;
        });
    }
}
