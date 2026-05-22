import { hasComponent } from "bitecs";
import { Position, System } from "@merlinn/helios-core";
import { defineQuery } from "bitecs";
import { ShipBob, ShipOrbit } from "../components/shipMotion";
import { getShipMotionTime } from "./shipMotionTime";

export class ShipBobSystem extends System {
    private readonly query = defineQuery([ShipBob, Position]);
    private readonly baseYByEid = new Map<number, number>();

    update(): void {
        const t = getShipMotionTime();
        const world = this.world;

        for (const eid of this.query(world)) {
            let baseY = this.baseYByEid.get(eid);
            if (baseY === undefined) {
                if (
                    hasComponent(world, ShipOrbit, eid) &&
                    ShipOrbit.baseY[eid] !== 0
                ) {
                    baseY = ShipOrbit.baseY[eid];
                } else {
                    baseY = Position.y[eid];
                }
                this.baseYByEid.set(eid, baseY);
            }

            const bob =
                ShipBob.amplitude[eid] *
                Math.sin(ShipBob.frequency[eid] * t + ShipBob.phase[eid]);
            Position.y[eid] = baseY + bob;
        }
    }
}
