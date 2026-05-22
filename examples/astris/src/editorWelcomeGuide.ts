import type { EditorGuideSection } from "@merlinn/helios-editor";

export const ASTRIS_EDITOR_GUIDE_SECTIONS: EditorGuideSection[] = [
    {
        id: "astris-gol",
        title: "Astris — Game of Life",
        bullets: [
            "Game tab — Conway field: LMB on a cell toggles it; drag paints or erases.",
            "Bottom HUD: Play/Stop, Pause, Paint/Erase, Clear, and pattern presets (guns, pulsar, etc.).",
            "Hover preview without buttons; live cells render as one instanced mesh.",
        ],
    },
    {
        id: "astris-camera",
        title: "Astris — camera in Play",
        bullets: [
            "In Play, fly camera (WASD, mouse) runs on the entity with AstrisFlyCamera.",
            "Ship motion simulation runs only in Play; the editor scene stays static.",
        ],
    },
];
