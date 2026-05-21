import type { EngineAPI } from "@merlinn/helios-core";
import type { GolPresetId } from "./astrisCapabilities";
import { ASTRIS_GOL_STATS_CAPABILITY, type GolStatsState } from "./astrisCapabilities";
import { lifeCellComponentMap } from "./lifeCellPrefab";
import { ensureLifeCellsRootEidFromApi } from "./lifeCellsRoot";

export type { GolPresetId };

/** Classic small patterns — left palette. */
export const GOL_BASIC_PRESET_IDS: readonly GolPresetId[] = [
    "glider",
    "blinker",
    "toad",
    "beacon",
    "lwss",
    "block",
    "beehive",
    "rpentomino",
] as const;

/** Guns, large oscillators, methuselahs — right palette. */
export const GOL_ADVANCED_PRESET_IDS: readonly GolPresetId[] = [
    "gosperGun",
    "simkinGun",
    "pulsar",
    "pentadecathlon",
    "queenBee",
    "diehard",
    "rabbits",
    "acorn",
] as const;

export const GOL_PRESET_IDS: readonly GolPresetId[] = [
    ...GOL_BASIC_PRESET_IDS,
    ...GOL_ADVANCED_PRESET_IDS,
] as const;

const PRESETS: Record<GolPresetId, ReadonlyArray<readonly [number, number]>> = {
    glider: [
        [1, 0],
        [2, 1],
        [0, 2],
        [1, 2],
        [2, 2],
    ],
    blinker: [
        [0, 0],
        [1, 0],
        [2, 0],
    ],
    toad: [
        [1, 0],
        [2, 0],
        [3, 0],
        [0, 1],
        [1, 1],
        [2, 1],
    ],
    beacon: [
        [1, 0],
        [2, 0],
        [1, 1],
        [3, 3],
        [4, 2],
        [4, 3],
    ],
    /** 9 cells, period 4, moves along +X (mirrored classic LWSS). */
    lwss: [
        [3, 0],
        [0, 0],
        [4, 1],
        [4, 2],
        [0, 2],
        [4, 3],
        [3, 3],
        [2, 3],
        [1, 3],
    ],
    block: [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
    ],
    beehive: [
        [1, 0],
        [2, 0],
        [0, 1],
        [3, 1],
        [1, 2],
        [2, 2],
    ],
    rpentomino: [
        [1, 0],
        [2, 0],
        [0, 1],
        [1, 1],
        [1, 2],
    ],
    pulsar: [
        [2, 0], [3, 0], [4, 0], [8, 0], [9, 0], [10, 0],
        [0, 2], [5, 2], [7, 2], [12, 2],
        [0, 3], [5, 3], [7, 3], [12, 3],
        [0, 4], [5, 4], [7, 4], [12, 4],
        [2, 5], [3, 5], [4, 5], [8, 5], [9, 5], [10, 5],
        [2, 7], [3, 7], [4, 7], [8, 7], [9, 7], [10, 7],
        [0, 8], [5, 8], [7, 8], [12, 8],
        [0, 9], [5, 9], [7, 9], [12, 9],
        [0, 10], [5, 10], [7, 10], [12, 10],
        [2, 12], [3, 12], [4, 12], [8, 12], [9, 12], [10, 12],
    ],
    pentadecathlon: [
        [0, 1], [1, 1], [2, 0], [2, 2], [3, 1], [4, 1],
        [5, 1], [6, 1], [7, 0], [7, 2], [8, 1], [9, 1],
    ],
    /** Gosper glider gun — canonical RLE 36×9 (copy.sh / ConwayLife). */
    gosperGun: [
        [24, 0], [22, 1], [24, 1], [12, 2], [13, 2], [20, 2], [21, 2],
        [34, 2], [35, 2], [11, 3], [15, 3], [20, 3], [21, 3], [34, 3],
        [35, 3], [0, 4], [1, 4], [10, 4], [16, 4], [20, 4], [21, 4],
        [0, 5], [1, 5], [10, 5], [14, 5], [16, 5], [17, 5], [22, 5],
        [24, 5], [10, 6], [16, 6], [24, 6], [11, 7], [15, 7], [12, 8],
        [13, 8],
    ],
    /** Simkin glider gun — canonical RLE 33×21 (copy.sh / ConwayLife). */
    simkinGun: [
        [0, 0], [1, 0], [7, 0], [8, 0], [0, 1], [1, 1], [7, 1], [8, 1],
        [4, 3], [5, 3], [4, 4], [5, 4], [22, 9], [23, 9], [25, 9], [26, 9],
        [21, 10], [27, 10], [21, 11], [28, 11], [31, 11], [32, 11], [21, 12],
        [22, 12], [23, 12], [27, 12], [31, 12], [32, 12], [26, 13], [20, 17],
        [21, 17], [20, 18], [21, 19], [22, 19], [23, 19], [23, 20],
    ],
    /** Trans queen bee shuttle — period 30 (queen bee + two blocks). */
    queenBee: [
        [9, 0], [7, 1], [9, 1], [6, 2], [8, 2], [20, 2],
        [21, 2], [0, 3], [1, 3], [5, 3], [8, 3], [20, 3],
        [21, 3], [0, 4], [1, 4], [6, 4], [8, 4], [7, 5],
        [9, 5], [9, 6],
    ],
    diehard: [
        [6, 0], [0, 1], [1, 1], [1, 2], [5, 2], [6, 2],
        [7, 2],
    ],
    rabbits: [
        [1, 0], [2, 0], [0, 1], [3, 1], [7, 2], [0, 3],
        [5, 3], [5, 4], [6, 4], [0, 5], [5, 5], [0, 6],
        [3, 6], [1, 7], [2, 7],
    ],
    acorn: [
        [1, 0], [3, 1], [0, 2], [1, 2], [2, 2],
    ],
};

export const GOL_PRESET_LABELS: Record<GolPresetId, string> = {
    glider: "Glider",
    blinker: "Blinker",
    toad: "Toad",
    beacon: "Beacon",
    lwss: "LWSS",
    block: "Block",
    beehive: "Beehive",
    rpentomino: "R-pent",
    pulsar: "Pulsar",
    pentadecathlon: "P15",
    gosperGun: "Gosper",
    simkinGun: "Simkin",
    queenBee: "QB shut",
    diehard: "Die hard",
    rabbits: "Rabbits",
    acorn: "Acorn",
};

export { GOL_PRESET_TOOLTIPS, GOL_TOOL_TOOLTIPS } from "./golPresetTooltips";
export type { GolPresetTooltip } from "./golPresetTooltips";

function cellKey(gx: number, gz: number): string {
    return `${gx},${gz}`;
}

export function getPresetOffsets(presetId: GolPresetId): ReadonlyArray<readonly [number, number]> {
    return PRESETS[presetId];
}

/** Large patterns are centered on the clicked cell (not top-left anchor). */
const CENTERED_PRESET_IDS = new Set<GolPresetId>(GOL_ADVANCED_PRESET_IDS);

/** Partial placement breaks guns and multi-cell oscillators (e.g. beacon). */
function requiresAtomicPlacement(presetId: GolPresetId): boolean {
    return PRESETS[presetId].length >= 6;
}

export function getPresetPlacementOffset(presetId: GolPresetId): readonly [number, number] {
    if (!CENTERED_PRESET_IDS.has(presetId)) {
        return [0, 0];
    }
    const offsets = PRESETS[presetId];
    let minGx = Infinity;
    let maxGx = -Infinity;
    let minGz = Infinity;
    let maxGz = -Infinity;
    for (const [gx, gz] of offsets) {
        minGx = Math.min(minGx, gx);
        maxGx = Math.max(maxGx, gx);
        minGz = Math.min(minGz, gz);
        maxGz = Math.max(maxGz, gz);
    }
    const cx = Math.floor((minGx + maxGx) / 2);
    const cz = Math.floor((minGz + maxGz) / 2);
    return [-cx, -cz];
}

export function mapPresetCellsToWorld(
    presetId: GolPresetId,
    originGx: number,
    originGz: number,
): Array<readonly [number, number]> {
    const [ox, oz] = getPresetPlacementOffset(presetId);
    return PRESETS[presetId].map(([dx, dz]) => [originGx + dx + ox, originGz + dz + oz] as const);
}

/** @deprecated Prefer {@link getLivingCellKeys} from `./golCellIndex`. */
export function livingCellKeys(api: EngineAPI): Set<string> {
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

export function applyGolPreset(
    api: EngineAPI,
    presetId: GolPresetId,
    originGx: number,
    originGz: number,
    aliveKeys?: Set<string>,
): number {
    const worldCells = mapPresetCellsToWorld(presetId, originGx, originGz);
    const alive = aliveKeys ?? livingCellKeys(api);
    const toPlace: Array<readonly [number, number]> = [];
    for (const [gx, gz] of worldCells) {
        if (!alive.has(cellKey(gx, gz))) {
            toPlace.push([gx, gz]);
        }
    }

    const atomic = requiresAtomicPlacement(presetId);
    if (atomic && toPlace.length !== worldCells.length) {
        return 0;
    }
    if (toPlace.length === 0) {
        return 0;
    }

    const cellsRootEid = ensureLifeCellsRootEidFromApi(api);
    for (const [gx, gz] of toPlace) {
        api.createEntityFromComponents(lifeCellComponentMap(gx, gz, cellsRootEid));
        alive.add(cellKey(gx, gz));
    }

    const stats = api.getCapability<GolStatsState>(ASTRIS_GOL_STATS_CAPABILITY);
    if (stats) {
        stats.aliveCount = alive.size;
    }
    return toPlace.length;
}
