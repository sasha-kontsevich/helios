import { LifeCell, Rotating } from "./components";

declare module "@merlinn/helios-core" {
    interface ComponentMap {
        Rotating: typeof Rotating;
        LifeCell: typeof LifeCell;
    }
}

export {};
