import type { Engine } from "@merlinn/helios-core";
import {
    THREE_RENDERER_CAPABILITY,
    tryGetEntityThreeObject,
    type ThreeRenderContext,
} from "@merlinn/helios-three-plugin";
import type { IWorld } from "bitecs";
import * as THREE from "three";
import { BoxHelper } from "three";
import type { ISelectionBus, SelectionEid } from "../selection/SelectionBus";

const SELECTION_BOX_COLOR = 0x00a8ff;

/**
 * Draws a {@link THREE.BoxHelper} around the selected entity's `ThreeObject` under {@link ThreeRenderContext.getEditorRoot}.
 */
export class EditorSelectionOverlay {
    private helper: BoxHelper | null = null;
    private editorRoot: THREE.Group | null = null;
    private world: IWorld | null = null;
    private unsub: (() => void) | null = null;
    private rafId = 0;

    constructor(private readonly selection: ISelectionBus) {}

    attach(engine: Engine): void {
        this.detach();

        const rc = engine.context.capabilities.get<ThreeRenderContext>(THREE_RENDERER_CAPABILITY);
        this.editorRoot = rc.getEditorRoot();
        this.world = engine.context.ecsWorld;

        this.unsub = this.selection.subscribe((eid) => {
            this.applySelection(eid);
        });

        const tick = (): void => {
            this.rafId = requestAnimationFrame(tick);
            this.helper?.update();
        };
        this.rafId = requestAnimationFrame(tick);
    }

    detach(): void {
        if (this.rafId !== 0) {
            cancelAnimationFrame(this.rafId);
            this.rafId = 0;
        }
        if (this.unsub) {
            this.unsub();
            this.unsub = null;
        }
        this.clearHelper();
        this.editorRoot = null;
        this.world = null;
    }

    private applySelection(eid: SelectionEid): void {
        this.clearHelper();
        if (eid === null || this.world === null || this.editorRoot === null) {
            return;
        }
        const obj = tryGetEntityThreeObject(this.world, eid);
        if (!obj) {
            return;
        }
        const helper = new BoxHelper(obj, SELECTION_BOX_COLOR);
        this.editorRoot.add(helper);
        this.helper = helper;
    }

    private clearHelper(): void {
        const h = this.helper;
        if (!h) {
            return;
        }
        this.helper = null;
        h.removeFromParent();
        h.geometry.dispose();
        const mat = h.material;
        if (Array.isArray(mat)) {
            for (const m of mat) {
                m.dispose();
            }
        } else {
            mat.dispose();
        }
    }
}
