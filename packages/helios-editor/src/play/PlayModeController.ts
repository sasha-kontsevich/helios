import {
    EDITOR_PLAY_SESSION_CAPABILITY,
    type EditorPlaySessionState,
    type EditorSceneSnapshotV1,
    type EngineAPI,
    type EntitySnapshot,
} from "@merlinn/helios-core";

export interface PlayModeOptions {
    /** Entities omitted from the pre-play snapshot (e.g. regenerated grid lines). */
    shouldExcludeEntity?: (eid: number, snapshot: EntitySnapshot) => boolean;
    /** After world reload from snapshot at Enter Play (deterministic start). */
    onEnterPlay?: () => void;
    /** Before world restore at Exit Play (e.g. clear input queues). */
    onExitPlay?: () => void;
}

/**
 * Unity-like Play Mode: capture snapshot on enter, restore on exit; single ECS world.
 * Syncs `EDITOR_PLAY_SESSION_CAPABILITY`; simulation systems are enabled/started on Enter Play
 * and stopped/disabled on Exit Play (see `EngineAPI.beginPlaySessionSystems` / `endPlaySessionSystems`).
 */
export class PlayModeController {
    private playing = false;

    /** Snapshot taken immediately before Enter Play; used for Exit Play restore. */
    private restoreSnapshot: EditorSceneSnapshotV1 | null = null;

    constructor(
        private readonly api: EngineAPI,
        private readonly options?: PlayModeOptions,
    ) {}

    get isPlaying(): boolean {
        return this.playing;
    }

    private syncPlaySessionCapability(): void {
        const st = this.api.getCapability<EditorPlaySessionState>(EDITOR_PLAY_SESSION_CAPABILITY);
        if (st) {
            st.active = this.playing;
        }
    }

    /** Enter Play: capture editor world, reload from that snapshot, then optional hooks. */
    async enterPlay(): Promise<void> {
        if (this.playing) {
            return;
        }
        const snap = this.api.captureSceneSnapshot({
            shouldExcludeEntity: this.options?.shouldExcludeEntity,
        });
        this.restoreSnapshot = snap;
        this.playing = true;
        this.syncPlaySessionCapability();
        this.api.applySceneSnapshot(snap);
        this.options?.onEnterPlay?.();
        await this.api.beginPlaySessionSystems();
    }

    /** Exit Play: optional hooks, then restore snapshot from before Play. */
    async exitPlay(): Promise<void> {
        if (!this.playing || !this.restoreSnapshot) {
            return;
        }
        const restore = this.restoreSnapshot;
        this.options?.onExitPlay?.();
        this.api.applySceneSnapshot(restore);
        this.restoreSnapshot = null;
        this.playing = false;
        this.syncPlaySessionCapability();
        await this.api.endPlaySessionSystems();
    }

    async togglePlay(): Promise<void> {
        if (this.playing) {
            await this.exitPlay();
        } else {
            await this.enterPlay();
        }
    }
}
