import { Context, Position, Rotation, System, rotateYInPlace } from "@merlinn/helios-core";
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
            const delta = Rotating.speed[eid] * deltaTime;
            rotateYInPlace(
                () => ({
                    x: Rotation.x[eid],
                    y: Rotation.y[eid],
                    z: Rotation.z[eid],
                    w: Rotation.w[eid],
                }),
                (q) => {
                    Rotation.x[eid] = q.x;
                    Rotation.y[eid] = q.y;
                    Rotation.z[eid] = q.z;
                    Rotation.w[eid] = q.w;
                },
                delta,
            );
        });
    }

}
