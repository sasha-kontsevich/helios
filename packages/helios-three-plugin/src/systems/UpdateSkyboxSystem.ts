import { Skybox, System } from "@merlinn/helios-core";
import { defineQuery } from "bitecs";
import * as THREE from "three";
import { getThreeRenderContext } from "../ThreeRenderContext";

function readSkyboxTextureGuid(eid: number): string | null {
    const tex = Skybox.get(eid).texture;
    return typeof tex === "string" && tex.length > 0 ? tex : null;
}

/**
 * Reads {@link Skybox} on ECS entities and applies equirect texture to `THREE.Scene.background`.
 * Uses the first matching entity; resets to solid color when none remain.
 */
export class UpdateSkyboxSystem extends System {
    static override readonly systemName = "UpdateSkyboxSystem";
    static override readonly systemDescription = "Updates skybox from the Skybox component.";
    static override readonly runsInEditor = true;

    private readonly query = defineQuery([Skybox]);
    private appliedGuid: string | null = null;
    private pendingGuid: string | null = null;
    private warnedMultiple = false;

    update(): void {
        const eids = this.query(this.world);
        if (eids.length > 1 && !this.warnedMultiple) {
            console.warn(
                `[UpdateSkyboxSystem] Multiple Skybox entities (${eids.length}); using the first.`,
            );
            this.warnedMultiple = true;
        }

        const guid = eids.length > 0 ? readSkyboxTextureGuid(eids[0]) : null;

        if (guid === this.appliedGuid) {
            return;
        }
        if (guid === this.pendingGuid) {
            return;
        }

        this.pendingGuid = guid;
        const rc = getThreeRenderContext(this.context);

        if (!guid) {
            rc.resetSceneBackground();
            this.appliedGuid = null;
            this.pendingGuid = null;
            return;
        }

        void this.context.assetManager
            .loadAsset(guid)
            .then((resourceId) => {
                if (this.pendingGuid !== guid) {
                    return;
                }
                const source = this.resources.get<THREE.Texture>(resourceId);
                const sky = source.clone();
                const hdr =
                    source instanceof THREE.DataTexture ||
                    source.type === THREE.HalfFloatType ||
                    source.type === THREE.FloatType;
                rc.setSceneBackgroundTexture(sky, { hdr });
                this.appliedGuid = guid;
                this.pendingGuid = null;
            })
            .catch((err) => {
                console.warn(`[UpdateSkyboxSystem] Failed to load skybox "${guid}"`, err);
                this.pendingGuid = null;
            });
    }
}
