import { defineQuery } from "bitecs";
import { System } from "@merlinn/helios-core";
import * as THREE from "three";
import { getThreeRenderContext } from "@merlinn/helios-three-plugin";
import { LifeCell } from "../components";

const INITIAL_CAPACITY = 4096;

const _matrix = new THREE.Matrix4();
const _position = new THREE.Vector3();
const _quaternion = new THREE.Quaternion();
const _scale = new THREE.Vector3(1, 1, 1);

/**
 * Renders all {@link LifeCell} entities with one {@link THREE.InstancedMesh} (no per-cell ECS mesh).
 */
export class LifeCellInstancedRenderSystem extends System {
    static override readonly systemName = "LifeCellInstancedRenderSystem";
    static override readonly systemDescription =
        "Живые клетки GoL одним InstancedMesh (без меша на каждую сущность).";
    static override readonly runsInEditor = true;

    private readonly cellQuery = defineQuery([LifeCell]);
    private instanced: THREE.InstancedMesh | null = null;
    private capacity = INITIAL_CAPACITY;

    start(): void {
        this.mountInstanced(this.capacity);
    }

    stop(): void {
        if (this.instanced) {
            this.instanced.removeFromParent();
            this.instanced.geometry.dispose();
            (this.instanced.material as THREE.Material).dispose();
            this.instanced = null;
        }
    }

    private mountInstanced(capacity: number): void {
        const rc = getThreeRenderContext(this.context);
        const geometry = new THREE.BoxGeometry(0.95, 0.95, 0.95);
        const material = new THREE.MeshStandardMaterial({
            color: 0x44aa88,
            roughness: 0.55,
            metalness: 0.15,
        });
        this.instanced = new THREE.InstancedMesh(geometry, material, capacity);
        this.instanced.name = "LifeCells";
        this.instanced.count = 0;
        this.instanced.frustumCulled = false;
        rc.getWorldRoot().add(this.instanced);
        this.capacity = capacity;
    }

    private ensureCapacity(needed: number): void {
        if (needed <= this.capacity || !this.instanced) {
            return;
        }
        let next = this.capacity;
        while (next < needed) {
            next *= 2;
        }
        this.instanced.removeFromParent();
        this.instanced.geometry.dispose();
        (this.instanced.material as THREE.Material).dispose();
        this.mountInstanced(next);
    }

    update(): void {
        const mesh = this.instanced;
        if (!mesh) {
            return;
        }

        const cells = this.cellQuery(this.world);
        const n = cells.length;
        if (n === 0) {
            mesh.count = 0;
            return;
        }

        this.ensureCapacity(n);

        let i = 0;
        for (const eid of cells) {
            _position.set(LifeCell.gx[eid], 0.5, LifeCell.gz[eid]);
            _matrix.compose(_position, _quaternion, _scale);
            mesh.setMatrixAt(i, _matrix);
            i++;
        }
        mesh.count = i;
        mesh.instanceMatrix.needsUpdate = true;
    }
}
