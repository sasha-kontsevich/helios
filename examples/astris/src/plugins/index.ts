import { ViewportInputPlugin } from "@merlinn/helios-input-plugin";
import { ThreePlugin } from "@merlinn/helios-three-plugin";

import { GameOfLifeViewportPlugin } from "./GameOfLifeViewportPlugin";



/** Canvas ids match {@link EditorShell.vue} (mounted before `engine.init`). */

export const Plugins = [

    new ThreePlugin({

        editorCanvasId: "helios-editor-view",

        gameCanvasId: "helios-game-view",

    }),

    new ViewportInputPlugin(),

    new GameOfLifeViewportPlugin(),

];

