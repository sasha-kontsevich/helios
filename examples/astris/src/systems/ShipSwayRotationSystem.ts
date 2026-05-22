import { Position, Rotation, System } from "@merlinn/helios-core";
import { defineQuery, hasComponent } from "bitecs";
import { ShipOrbit, ShipSway } from "../components/shipMotion";
import { applyBankAndSwayToQuat, ensureRotationComponent } from "./shipMotionMath";
import { getShipMotionTime } from "./shipMotionTime";

export class ShipSwayRotationSystem extends System {
    private readonly query = defineQuery([ShipSway]);

    update(): void {
        const t = getShipMotionTime();

        for (const eid of this.query(this.world)) {
            ensureRotationComponent(this.world, eid);
            const base = {
                x: Rotation.x[eid],
                y: Rotation.y[eid],
                z: Rotation.z[eid],
                w: Rotation.w[eid],
            };
            let inwardX = 0;
            let inwardZ = 0;
            let bank = 0;
            if (
                hasComponent(this.world, ShipOrbit, eid) &&
                hasComponent(this.world, Position, eid) &&
                ShipSway.bankTowardCenter[eid] !== 0
            ) {
                const px = Position.x[eid];
                const pz = Position.z[eid];
                const cx = ShipOrbit.centerX[eid];
                const cz = ShipOrbit.centerZ[eid];
                inwardX = cx - px;
                inwardZ = cz - pz;
                const len = Math.hypot(inwardX, inwardZ);
                if (len > 1e-6) {
                    inwardX /= len;
                    inwardZ /= len;
                    bank = ShipSway.bankTowardCenter[eid];
                }
            }

            const q = applyBankAndSwayToQuat(
                base,
                inwardX,
                inwardZ,
                bank,
                ShipSway.rollAmplitude[eid],
                ShipSway.pitchAmplitude[eid],
                ShipSway.frequency[eid] * t + ShipSway.phase[eid],
            );
            Rotation.x[eid] = q.x;
            Rotation.y[eid] = q.y;
            Rotation.z[eid] = q.z;
            Rotation.w[eid] = q.w;
        }
    }
}
