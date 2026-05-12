import type { Engine } from "@merlinn/helios-core";
import {
    THREE_RENDERER_CAPABILITY,
    tryGetEntityThreeObject,
    type ThreeRenderContext,
} from "@merlinn/helios-three-plugin";
import type { IWorld } from "bitecs";
import * as THREE from "three";
import type { ISelectionBus, SelectionEid } from "../selection/SelectionBus";

/** Accent for mesh edge outlines and fallback box (lights/cameras without meshes). */
const SELECTION_OUTLINE_COLOR = 0x00a8ff;

/** Degrees — edges sharper than this appear in {@link THREE.EdgesGeometry}. */
const EDGE_THRESHOLD_ANGLE = 1;

/**
 * Highlights the selected entity: **edge outlines** on each {@link THREE.Mesh} under its `ThreeObject`,
 * parented in mesh local space so transforms stay in sync. Objects without meshes fall back to {@link THREE.BoxHelper}.
 */
export class EditorSelectionOverlay {
    private readonly outlineParts: THREE.LineSegments[] = [];
    private fallbackHelper: THREE.BoxHelper | null = null;
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
            this.fallbackHelper?.update();
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

        obj.updateWorldMatrix(true, false);

        obj.traverse((child) => {
            if (!(child instanceof THREE.Mesh)) return;
            const geom = child.geometry;
            if (!geom || !geom.getAttribute("position")) return;

            let edges: THREE.EdgesGeometry;
            try {
                edges = new THREE.EdgesGeometry(geom, EDGE_THRESHOLD_ANGLE);
            } catch {
                return;
            }

            const mat = new THREE.LineBasicMaterial({
                color: SELECTION_OUTLINE_COLOR,
                depthTest: true,
            });
            const lines = new THREE.LineSegments(edges, mat);
            lines.renderOrder = 1000;
            /** Selection outline must not raycast — default Line threshold would steal picks near this mesh. */
            lines.raycast = (): void => {};
            child.add(lines);
            this.outlineParts.push(lines);
        });

        if (this.outlineParts.length === 0) {
            const helper = new THREE.BoxHelper(obj, SELECTION_OUTLINE_COLOR);
            this.editorRoot.add(helper);
            this.fallbackHelper = helper;
        }
    }

    private clearHelper(): void {
        for (const lines of this.outlineParts) {
            lines.removeFromParent();
            lines.geometry.dispose();
            const m = lines.material;
            if (Array.isArray(m)) {
                for (const x of m) x.dispose();
            } else {
                m.dispose();
            }
        }
        this.outlineParts.length = 0;

        const h = this.fallbackHelper;
        if (h) {
            this.fallbackHelper = null;
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
}
