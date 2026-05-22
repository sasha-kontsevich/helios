import { FOG_TYPE_EXP2, Fog, System } from "@merlinn/helios-core";
import { defineQuery } from "bitecs";
import * as THREE from "three";
import { getThreeRenderContext } from "../ThreeRenderContext";

function fogStateKey(eid: number): string {
    return [
        Fog.type[eid],
        Fog.color[eid],
        Fog.near[eid],
        Fog.far[eid],
        Fog.density[eid],
    ].join("|");
}

function buildThreeFog(eid: number): THREE.Fog | THREE.FogExp2 {
    const color = Fog.color[eid] ?? 0xcccccc;
    if (Fog.type[eid] === FOG_TYPE_EXP2) {
        return new THREE.FogExp2(color, Fog.density[eid] ?? 0.00025);
    }
    return new THREE.Fog(color, Fog.near[eid] ?? 1, Fog.far[eid] ?? 1000);
}

/**
 * Reads {@link Fog} on ECS entities and applies `THREE.Scene.fog`.
 * Uses the first matching entity; clears fog when none remain.
 */
export class UpdateFogSystem extends System {
    static override readonly systemName = "UpdateFogSystem";
    static override readonly systemDescription = "Syncs scene fog from the Fog component.";
    static override readonly runsInEditor = true;

    private readonly query = defineQuery([Fog]);
    private appliedKey: string | null = null;
    private warnedMultiple = false;

    update(): void {
        const eids = this.query(this.world);
        if (eids.length > 1 && !this.warnedMultiple) {
            console.warn(`[UpdateFogSystem] Multiple Fog entities (${eids.length}); using the first.`);
            this.warnedMultiple = true;
        }

        const rc = getThreeRenderContext(this.context);

        if (eids.length === 0) {
            if (this.appliedKey !== null) {
                rc.clearSceneFog();
                this.appliedKey = null;
            }
            return;
        }

        const eid = eids[0];
        const key = fogStateKey(eid);
        if (key === this.appliedKey) {
            return;
        }

        rc.setSceneFog(buildThreeFog(eid));
        this.appliedKey = key;
    }
}
