/** ECS viewport input singleton metadata registered by ViewportInputPlugin. */
export const VIEWPORT_INPUT_CAPABILITY = "game.viewportInput" as const;

export interface ViewportInputCapability {
    inputEntity: number;
}

export const ViewportInputKey = {
    W: 1 << 0,
    A: 1 << 1,
    S: 1 << 2,
    D: 1 << 3,
    Q: 1 << 4,
    E: 1 << 5,
    Shift: 1 << 6,
    Alt: 1 << 7,
} as const;

export type ViewportInputKeyFlag = (typeof ViewportInputKey)[keyof typeof ViewportInputKey];

export const ViewportInputButton = {
    Left: 1 << 0,
    Middle: 1 << 1,
    Right: 1 << 2,
} as const;

export type ViewportInputButtonFlag = (typeof ViewportInputButton)[keyof typeof ViewportInputButton];
