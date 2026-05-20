import { System } from "@merlinn/helios-core";
import { THREE_RENDERER_CAPABILITY, type ThreeRenderContext } from "@merlinn/helios-three-plugin";
import * as THREE from "three";
import {
    ASTRIS_GOL_HOVER_CAPABILITY,
    type GolHoverPreviewKind,
    type GolHoverState,
} from "../game/astrisCapabilities";

const POOL_SIZE = 128;
const BOX = 0.95;
const Y = 0.5;

const COLOR_PLACE = 0x44aa88;
const COLOR_ERASE = 0xe85d5d;
const COLOR_PRESET = 0x5fd4a8;
const COLOR_TOGGLE_REMOVE = 0xc09050;

/**
 * Renders semi-transparent box previews for grid hover (no ECS entities).
 */
export class GolHoverPreviewSystem extends System {
    static override readonly runsInEditor = true;

    private group: THREE.Group | null = null;
    private readonly pool: THREE.Mesh[] = [];
    private readonly geometry = new THREE.BoxGeometry(BOX, BOX, BOX);
    private readonly materials = new Map<GolHoverPreviewKind, THREE.MeshStandardMaterial>();

    async start(): Promise<void> {
        const rc = this.context.capabilities.getOrUndefined<ThreeRenderContext>(THREE_RENDERER_CAPABILITY);
        if (!rc) {
            return;
        }
        this.group = new THREE.Group();
        this.group.name = "GolHoverPreview";
        rc.getWorldRoot().add(this.group);

        for (const kind of ["place", "erase", "preset", "toggleRemove"] as GolHoverPreviewKind[]) {
            this.materials.set(
                kind,
                new THREE.MeshStandardMaterial({
                    color: colorForKind(kind),
                    transparent: true,
                    opacity: kind === "toggleRemove" ? 0.28 : 0.38,
                    roughness: 0.55,
                    metalness: 0.1,
                    depthWrite: false,
                }),
            );
        }

        for (let i = 0; i < POOL_SIZE; i++) {
            const mesh = new THREE.Mesh(this.geometry, this.materials.get("place")!);
            mesh.visible = false;
            mesh.castShadow = false;
            mesh.receiveShadow = false;
            this.pool.push(mesh);
            this.group.add(mesh);
        }
    }

    update(): void {
        if (!this.group) {
            return;
        }
        const hover = this.context.capabilities.getOrUndefined<GolHoverState>(ASTRIS_GOL_HOVER_CAPABILITY);
        if (!hover?.active || hover.cells.length === 0) {
            for (const mesh of this.pool) {
                mesh.visible = false;
            }
            return;
        }

        const mat = this.materials.get(hover.kind) ?? this.materials.get("place")!;
        const n = Math.min(hover.cells.length, POOL_SIZE);
        for (let i = 0; i < n; i++) {
            const [gx, gz] = hover.cells[i]!;
            const mesh = this.pool[i]!;
            mesh.material = mat;
            mesh.position.set(gx, Y, gz);
            mesh.visible = true;
        }
        for (let i = n; i < POOL_SIZE; i++) {
            this.pool[i]!.visible = false;
        }
    }

    async stop(): Promise<void> {
        if (!this.group) {
            return;
        }
        this.group.removeFromParent();
        this.pool.length = 0;
        for (const mat of this.materials.values()) {
            mat.dispose();
        }
        this.materials.clear();
        this.geometry.dispose();
        this.group = null;
    }
}

function colorForKind(kind: GolHoverPreviewKind): number {
    switch (kind) {
        case "erase":
            return COLOR_ERASE;
        case "preset":
            return COLOR_PRESET;
        case "toggleRemove":
            return COLOR_TOGGLE_REMOVE;
        default:
            return COLOR_PLACE;
    }
}
