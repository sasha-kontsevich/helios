import type { EditorGuideSection } from "./editorGuideTypes";

export const DEFAULT_EDITOR_GUIDE_STORAGE_KEY = "helios.editor.guideDismissed.v1";

export const DEFAULT_EDITOR_GUIDE_SECTIONS: EditorGuideSection[] = [
    {
        id: "overview",
        title: "Editor and game",
        bullets: [
            "Editor tab — scene layout, camera, gizmo, entity selection.",
            "Game tab — separate canvas and input; HUD and game logic run here.",
            "Bottom status bar — asset loading from the server (indexing, scene, textures, models).",
        ],
    },
    {
        id: "leftPanel",
        title: "Left panel",
        bullets: [
            "Entities — entity tree; drag-and-drop changes parent (Parent).",
            "Systems — engine systems list, enable/disable (simulation starts in Play).",
            "Assets — models and textures; drag .glb/.obj or .png/.jpg into the viewport.",
        ],
    },
    {
        id: "viewport",
        title: "Viewport (Editor)",
        bullets: [
            "RMB — orbit and fly the free camera; pick an ECS Camera from the list.",
            "LMB — selection; W / E / R — move, rotate, scale; Q — show/hide gizmo.",
            "Entity context menu — copy, paste, delete.",
        ],
    },
    {
        id: "play",
        title: "Play / Pause",
        bullets: [
            "Play — scene snapshot and start simulation systems; Stop — restore editor scene.",
            "Pause — temporarily skips simulation update without leaving Play.",
            "Play automatically switches to the Game tab.",
        ],
    },
    {
        id: "inspector",
        title: "Inspector (right)",
        bullets: [
            "Fields for the selected entity's components; Raw — edit descriptor JSON.",
            "Add and remove components; copy/paste components from the clipboard.",
        ],
    },
    {
        id: "tips",
        title: "Tips",
        bullets: [
            "Scene and assets come from JSON and files under public/assets; saving to disk depends on the host app.",
            "Open this guide again with the ? button on the top bar.",
        ],
    },
];
