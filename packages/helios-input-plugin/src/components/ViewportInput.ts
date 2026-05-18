import { Types } from "bitecs";
import { defineComponent } from "@merlinn/helios-core";

/** Singleton component written by ViewportInputPlugin. */
export const ViewportInput = defineComponent({
    enabled: Types.ui8,
    keys: Types.ui32,
    buttons: Types.ui8,
    lookDeltaX: Types.f32,
    lookDeltaY: Types.f32,
});

declare module "@merlinn/helios-core" {
    interface ComponentMap {
        ViewportInput: typeof ViewportInput;
    }
}
