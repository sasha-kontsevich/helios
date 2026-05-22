import { Position, quatFromYawPitch, Rotation, System } from "@merlinn/helios-core";
import { defineQuery } from "bitecs";
import { ShipOrbit } from "../components/shipMotion";
import { ensureRotationComponent } from "./shipMotionMath";
import { advanceShipMotionTime, getShipMotionTime } from "./shipMotionTime";

export class ShipOrbitSystem extends System {
    static override readonly systemName = "ShipOrbitSystem";
    static override readonly systemDescription =
        "Ship orbit around a point; yaw and position (Play only).";

    private readonly query = defineQuery([ShipOrbit, Position]);
    private readonly initialized = new Set<number>();

    update(deltaTime: number): void {
        advanceShipMotionTime(deltaTime);
        const t = getShipMotionTime();

        for (const eid of this.query(this.world)) {
            if (!this.initialized.has(eid)) {
                if (ShipOrbit.baseY[eid] === 0) {
                    ShipOrbit.baseY[eid] = Position.y[eid];
                }
                this.initialized.add(eid);
            }

            const angle =
                ShipOrbit.phase[eid] + ShipOrbit.speed[eid] * t;
            const cx = ShipOrbit.centerX[eid];
            const cz = ShipOrbit.centerZ[eid];
            const r = ShipOrbit.radius[eid];

            Position.x[eid] = cx + Math.cos(angle) * r;
            Position.z[eid] = cz + Math.sin(angle) * r;
            Position.y[eid] = ShipOrbit.baseY[eid];

            if (ShipOrbit.faceTangent[eid] !== 0) {
                ensureRotationComponent(this.world, eid);
                // Tangent in XZ, then +π/2 (90° clockwise from above) for model forward axis.
                const yaw =
                    Math.atan2(-Math.sin(angle), Math.cos(angle)) + Math.PI / 2;
                const q = quatFromYawPitch(yaw, 0);
                Rotation.x[eid] = q.x;
                Rotation.y[eid] = q.y;
                Rotation.z[eid] = q.z;
                Rotation.w[eid] = q.w;
            }
        }
    }
}
