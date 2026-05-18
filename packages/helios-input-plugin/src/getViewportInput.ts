import type { Context } from "@merlinn/helios-core";
import { VIEWPORT_INPUT_CAPABILITY, type ViewportInputCapability } from "./ViewportInputCapability";
import { ViewportInput } from "./components/ViewportInput";

export function getViewportInputEntity(context: Context): number | null {
    return context.capabilities.getOrUndefined<ViewportInputCapability>(VIEWPORT_INPUT_CAPABILITY)?.inputEntity ?? null;
}

export function clearViewportInputFrame(inputEntity: number): void {
    ViewportInput.lookDeltaX[inputEntity] = 0;
    ViewportInput.lookDeltaY[inputEntity] = 0;
}

export function isViewportInputEnabled(inputEntity: number): boolean {
    return ViewportInput.enabled[inputEntity] !== 0;
}
