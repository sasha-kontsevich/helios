import { defineQuery } from "bitecs";
import { System } from "@merlinn/helios-core";
import { LifeCell } from "../components";
import { lifeCellComponentMap } from "../game/lifeCellPrefab";

const NEIGHBOR_OFFSETS: ReadonlyArray<readonly [number, number]> = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
];

/** Seconds between Conway generations. */
const STEP_INTERVAL_SEC = 0.1;

function cellKey(gx: number, gz: number): string {
    return `${gx},${gz}`;
}

function parseCellKey(key: string): [number, number] {
    const i = key.indexOf(",");
    return [Number(key.slice(0, i)), Number(key.slice(i + 1))];
}

/**
 * Classic Conway's Game of Life on the XZ integer lattice (Y ignored for topology).
 * Syncs ECS entities with {@link LifeCell} to match each generation.
 */
export class GameOfLifeStepSystem extends System {
    private readonly cellQuery = defineQuery([LifeCell]);
    private stepAccumulator = 0;

    update(deltaTime: number): void {
        this.stepAccumulator += deltaTime;
        if (this.stepAccumulator < STEP_INTERVAL_SEC) {
            return;
        }
        this.stepAccumulator %= STEP_INTERVAL_SEC;

        const world = this.world;
        const api = this.context.engine.api;

        const alive = new Map<string, number>();
        for (const eid of this.cellQuery(world)) {
            alive.set(cellKey(LifeCell.gx[eid], LifeCell.gz[eid]), eid);
        }
        if (alive.size === 0) {
            return;
        }

        const candidates = new Set<string>();
        for (const key of alive.keys()) {
            candidates.add(key);
            const [gx, gz] = parseCellKey(key);
            for (const [dx, dz] of NEIGHBOR_OFFSETS) {
                candidates.add(cellKey(gx + dx, gz + dz));
            }
        }

        const nextAlive = new Set<string>();
        for (const key of candidates) {
            const [gx, gz] = parseCellKey(key);
            let n = 0;
            for (const [dx, dz] of NEIGHBOR_OFFSETS) {
                if (alive.has(cellKey(gx + dx, gz + dz))) {
                    n++;
                }
            }
            const wasAlive = alive.has(key);
            if (wasAlive) {
                if (n === 2 || n === 3) {
                    nextAlive.add(key);
                }
            } else if (n === 3) {
                nextAlive.add(key);
            }
        }

        const toRemove: number[] = [];
        for (const eid of this.cellQuery(world)) {
            const k = cellKey(LifeCell.gx[eid], LifeCell.gz[eid]);
            if (!nextAlive.has(k)) {
                toRemove.push(eid);
            }
        }
        for (const eid of toRemove) {
            api.deleteEntity(eid);
        }

        const toAdd: Array<{ gx: number; gz: number }> = [];
        for (const key of nextAlive) {
            if (!alive.has(key)) {
                const [gx, gz] = parseCellKey(key);
                toAdd.push({ gx, gz });
            }
        }
        for (const { gx, gz } of toAdd) {
            api.createEntityFromComponents(lifeCellComponentMap(gx, gz));
        }
    }
}
