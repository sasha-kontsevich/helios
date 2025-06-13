import {Position, System} from "@merlinn/helios-core";
import { defineQuery } from "bitecs";
import {ThreeCamera} from "../components";

export class CameraRotationSystem extends System {
    private query = defineQuery([ThreeCamera, Position]);
    private radius = 5;
    private time = 0;
    private speed = -0.2

    update(deltaTime: number): void {
        this.time += deltaTime;

        this.query(this.world).forEach((eid) => {
            Position.x[eid] = Math.sin(this.time * this.speed) * this.radius;
            Position.z[eid] = Math.cos(this.time * this.speed) * this.radius;
        });
    }

}
