import { LifeCell, Rotating, ViewportCameraControl } from "./components";

declare module "@merlinn/helios-core" {
    interface ComponentMap {
        Rotating: typeof Rotating;
        LifeCell: typeof LifeCell;
        ViewportCameraControl: typeof ViewportCameraControl;
    }
}

export {};
