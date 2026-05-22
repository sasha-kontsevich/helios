import { System } from "@merlinn/helios-core";
import * as THREE from "three";
import { getThreeRenderContext } from "@merlinn/helios-three-plugin";
import {
    ASTRIS_GOL_HOVER_CAPABILITY,
    type GolHoverPreviewKind,
    type GolHoverState,
} from "../game/astrisCapabilities";
import { computeHoverCells, HOVER_PREVIEW_MAX_CELLS } from "../game/golHoverLogic";

const PREVIEW_MATERIALS: Record<
    GolHoverPreviewKind,
    { color: number; roughness: number; metalness: number }
> = {
    place: { color: 0x44aa88, roughness: 0.55, metalness: 0.1 },
    erase: { color: 0xe85d5d, roughness: 0.55, metalness: 0.1 },
    preset: { color: 0x5fd4a8, roughness: 0.55, metalness: 0.1 },
    toggleRemove: { color: 0xc09050, roughness: 0.55, metalness: 0.1 },
};

const _matrix = new THREE.Matrix4();
const _position = new THREE.Vector3();
const _quaternion = new THREE.Quaternion();
const _scale = new THREE.Vector3(1, 1, 1);

/**
 * Renders GOL hover preview via {@link THREE.InstancedMesh} (no per-cell ECS spawn).
 */
export class GolHoverSyncSystem extends System {
    static override readonly systemName = "GolHoverSyncSystem";
    static override readonly systemDescription =
        "Cell preview under the cursor (instanced mesh, color by mode).";
    static override readonly runsInEditor = true;

    private instanced: THREE.InstancedMesh | null = null;
    private lastKind: GolHoverPreviewKind | null = null;

    start(): void {
        const rc = getThreeRenderContext(this.context);
        const geometry = new THREE.BoxGeometry(0.95, 0.95, 0.95);
        const material = new THREE.MeshStandardMaterial({
            color: PREVIEW_MATERIALS.place.color,
            roughness: PREVIEW_MATERIALS.place.roughness,
            metalness: PREVIEW_MATERIALS.place.metalness,
            transparent: true,
            opacity: 0.55,
            depthWrite: false,
        });
        this.instanced = new THREE.InstancedMesh(geometry, material, HOVER_PREVIEW_MAX_CELLS);
        this.instanced.name = "GolHoverPreview";
        this.instanced.count = 0;
        this.instanced.frustumCulled = false;
        rc.getWorldRoot().add(this.instanced);
    }

    stop(): void {
        if (this.instanced) {
            this.instanced.removeFromParent();
            this.instanced.geometry.dispose();
            (this.instanced.material as THREE.Material).dispose();
            this.instanced = null;
        }
        this.lastKind = null;
    }

    update(): void {
        const mesh = this.instanced;
        if (!mesh) {
            return;
        }

        const hover = this.context.capabilities.getOrUndefined<GolHoverState>(ASTRIS_GOL_HOVER_CAPABILITY);
        if (!hover?.active) {
            mesh.count = 0;
            this.lastKind = null;
            return;
        }

        const desired = computeHoverCells(this.context.engine, hover.originGx, hover.originGz);
        if (!desired.active || desired.cells.length === 0) {
            mesh.count = 0;
            this.lastKind = null;
            return;
        }

        if (this.lastKind !== desired.kind) {
            const mat = PREVIEW_MATERIALS[desired.kind];
            const m = mesh.material as THREE.MeshStandardMaterial;
            m.color.setHex(mat.color);
            m.roughness = mat.roughness;
            m.metalness = mat.metalness;
            this.lastKind = desired.kind;
        }

        const n = Math.min(desired.cells.length, HOVER_PREVIEW_MAX_CELLS);
        for (let i = 0; i < n; i++) {
            const [gx, gz] = desired.cells[i]!;
            _position.set(gx, 0.5, gz);
            _matrix.compose(_position, _quaternion, _scale);
            mesh.setMatrixAt(i, _matrix);
        }
        mesh.count = n;
        mesh.instanceMatrix.needsUpdate = true;
    }
}
