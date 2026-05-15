import type { Context } from "@merlinn/helios-core";
import { VIEWPORT_INPUT_CAPABILITY, type ViewportInputState } from "./ViewportInputCapability";

export function getViewportInput(context: Context): ViewportInputState {
    const state = context.capabilities.get<ViewportInputState>(VIEWPORT_INPUT_CAPABILITY);
    if (!state) {
        throw new Error(
            `[helios-input-plugin] Missing capability "${VIEWPORT_INPUT_CAPABILITY}". Register ViewportInputPlugin.`,
        );
    }
    return state;
}
