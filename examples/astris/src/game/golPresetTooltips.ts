import type { GolPresetId } from "./astrisCapabilities";

export interface GolPresetTooltip {
    title: string;
    tag: string;
    body: string;
}

export const GOL_TOOL_TOOLTIPS = {
    paint: {
        title: "Paint",
        tag: "Tool",
        body: "Places live cells on click and while LMB is held. On an empty cell — single-cell preview.",
    },
    erase: {
        title: "Erase",
        tag: "Tool",
        body: "Removes cells on click and while dragging. Preview only over live cells.",
    },
} as const satisfies Record<"paint" | "erase", GolPresetTooltip>;

export const GOL_PRESET_TOOLTIPS: Record<GolPresetId, GolPresetTooltip> = {
    glider: {
        title: "Glider",
        tag: "Spaceship · c/4",
        body: "Classic moving pattern: crawls diagonally. Anchor is the cell under the cursor.",
    },
    blinker: {
        title: "Blinker",
        tag: "Oscillator · period 2",
        body: "Three cells in a row, oscillates vertical ↔ horizontal. Simplest oscillator.",
    },
    toad: {
        title: "Toad",
        tag: "Oscillator · period 2",
        body: "Two offset rows of three cells. Phase flips every two generations.",
    },
    beacon: {
        title: "Beacon",
        tag: "Oscillator · Play",
        body: "Two 2×2 blocks apart — period 2. Place on empty space and press Play.",
    },
    lwss: {
        title: "LWSS",
        tag: "Spaceship · c/2",
        body: "Lightweight spaceship: 9 cells, period 4, moves along +X (right on the grid). Leave empty cells to the right.",
    },
    block: {
        title: "Block",
        tag: "Still life",
        body: "2×2 square — unchanged every generation. Building block for larger patterns.",
    },
    beehive: {
        title: "Beehive",
        tag: "Still life",
        body: "Static six-cell “figure eight”. Often left behind after explosions.",
    },
    rpentomino: {
        title: "R-pentomino",
        tag: "Methuselah",
        body: "Only five cells, but chaos for ~1103 generations before stabilizing.",
    },
    pulsar: {
        title: "Pulsar",
        tag: "Oscillator · period 3",
        body: "Symmetric 48-cell “star” — one of the most iconic Life patterns.",
    },
    pentadecathlon: {
        title: "Pentadecathlon",
        tag: "Oscillator · period 15",
        body: "12 cells, wavy period-15 oscillator from Conway’s R-pentomino family.",
    },
    gosperGun: {
        title: "Gosper glider gun",
        tag: "Gun · 36 cells",
        body: "Canonical Gosper gun (36×9). Center under cursor, empty field, Play — glider every 30 generations.",
    },
    simkinGun: {
        title: "Simkin glider gun",
        tag: "Gun · 36 cells",
        body: "Simkin gun (33×21). Center under cursor, empty field, Play — smaller than Gosper, emits gliders.",
    },
    queenBee: {
        title: "Queen bee shuttle",
        tag: "Oscillator · period 30",
        body: "Queen bee between two blocks — classic Gosper shuttle. Needs horizontal clearance.",
    },
    diehard: {
        title: "Diehard",
        tag: "Methuselah · 130 generations",
        body: "Exactly 7 cells — dies out on generation 130. Handy to verify the Gen counter.",
    },
    rabbits: {
        title: "Rabbits",
        tag: "Long methuselah",
        body: "Fifteen cells, runs for thousands of generations. Needs lots of free grid space.",
    },
    acorn: {
        title: "Acorn",
        tag: "Methuselah · 7 cells",
        body: "Classic Acorn: 7 cells, long chaos (~5206 generations to stabilize). Needs plenty of room.",
    },
};
