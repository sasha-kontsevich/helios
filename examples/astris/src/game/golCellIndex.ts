import type { Engine } from "@merlinn/helios-core";
import type { EngineAPI } from "@merlinn/helios-core";
import { ASTRIS_GOL_CELL_INDEX_CAPABILITY } from "./astrisCapabilities";

function cellKey(gx: number, gz: number): string {
    return `${gx},${gz}`;
}

function scanLivingCellKeys(api: EngineAPI): Set<string> {
    const keys = new Set<string>();
    for (const snap of api.getAllEntities()) {
        if (!Object.prototype.hasOwnProperty.call(snap.components, "LifeCell")) {
            continue;
        }
        const cell = snap.components.LifeCell as { gx?: number; gz?: number };
        if (typeof cell.gx === "number" && typeof cell.gz === "number") {
            keys.add(cellKey(cell.gx, cell.gz));
        }
    }
    return keys;
}

export function rebuildCellIndexFromWorld(api: EngineAPI, index: GolAliveCellIndex): void {
    index.clear();
    const keys = scanLivingCellKeys(api);
    for (const key of keys) {
        const comma = key.indexOf(",");
        index.add(Number(key.slice(0, comma)), Number(key.slice(comma + 1)));
    }
}

/** Occupied grid keys backed by {@link GolAliveCellIndex} when the GOL plugin is active. */
export function getLivingCellKeys(engine: Engine): Set<string> {
    const index = engine.context.capabilities.getOrUndefined<GolAliveCellIndex>(
        ASTRIS_GOL_CELL_INDEX_CAPABILITY,
    );
    if (!index) {
        return scanLivingCellKeys(engine.api);
    }
    if (index.size === 0) {
        rebuildCellIndexFromWorld(engine.api, index);
    }
    return index.keys();
}

/** O(1) occupancy index for {@link LifeCell} grid keys (avoids scanning the whole ECS each hover). */
export class GolAliveCellIndex {
    private readonly alive = new Set<string>();

    has(gx: number, gz: number): boolean {
        return this.alive.has(cellKey(gx, gz));
    }

    hasKey(key: string): boolean {
        return this.alive.has(key);
    }

    keys(): Set<string> {
        return this.alive;
    }

    add(gx: number, gz: number): void {
        this.alive.add(cellKey(gx, gz));
    }

    remove(gx: number, gz: number): void {
        this.alive.delete(cellKey(gx, gz));
    }

    removeKey(key: string): void {
        this.alive.delete(key);
    }

    clear(): void {
        this.alive.clear();
    }

    get size(): number {
        return this.alive.size;
    }
}
