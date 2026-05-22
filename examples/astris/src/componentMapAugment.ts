import {
    AstrisFlyCamera,
    LifeCell,
    LifeCellPreview,
    Rotating,
    ShipBob,
    ShipOrbit,
    ShipSway,
} from "./components";

declare module "@merlinn/helios-core" {
    interface ComponentMap {
        Rotating: typeof Rotating;
        LifeCell: typeof LifeCell;
        LifeCellPreview: typeof LifeCellPreview;
        AstrisFlyCamera: typeof AstrisFlyCamera;
        ShipOrbit: typeof ShipOrbit;
        ShipBob: typeof ShipBob;
        ShipSway: typeof ShipSway;
    }
}

export {};
