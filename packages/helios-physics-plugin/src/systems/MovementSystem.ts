import { defineQuery } from 'bitecs';
import { System, Position } from "@merlinn/helios-core";
import { Velocity } from "../components";

export class MovementSystem extends System {
    static override readonly systemName = "MovementSystem";
    static override readonly systemDescription = "Интегрирует Velocity в Position (физика).";
    private query = defineQuery([Position, Velocity]);

    update(deltaTime: number): void {
        const eid = this.query(this.world);

        for (const entity of eid) {
            Position.x[entity] += Velocity.x[entity] * deltaTime;
            Position.y[entity] += Velocity.y[entity] * deltaTime;
            Position.z[entity] += Velocity.z[entity] * deltaTime;
        }
    }
}
