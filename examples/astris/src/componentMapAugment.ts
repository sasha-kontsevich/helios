import { AstrisFlyCamera, LifeCell, LifeCellPreview, Rotating } from "./components";

declare module "@merlinn/helios-core" {
    interface ComponentMap {
        Rotating: typeof Rotating;
        LifeCell: typeof LifeCell;
        LifeCellPreview: typeof LifeCellPreview;
        AstrisFlyCamera: typeof AstrisFlyCamera;
    }
}

export {};
