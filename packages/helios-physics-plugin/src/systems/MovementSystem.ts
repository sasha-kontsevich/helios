import { defineQuery } from 'bitecs';
import {ISystem} from "../../../engine";
import {Context} from "../../../engine";

export class MovementSystem implements ISystem {
    private query = defineQuery([]);

    init(context: Context) {
        const Position = context.components.get('Position');
        const Velocity = context.components.get('Velocity');

        this.query = defineQuery([Position, Velocity]);
    }

    public update(context: Context, deltaTime: number): void {
        const Position = context.components.get('Position');
        const Velocity = context.components.get('Velocity');

        const eid = this.query(context.ecsWorld);
        
        for (const entity of eid) {
            Position.x[entity] += Velocity.x[entity] * deltaTime;
            Position.y[entity] += Velocity.y[entity] * deltaTime;
            Position.z[entity] += Velocity.z[entity] * deltaTime;
        }
    }
} 