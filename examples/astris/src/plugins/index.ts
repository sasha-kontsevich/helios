import {ThreePlugin} from "@merlinn/helios-three-plugin";

const canvasContainer = document.getElementById("canvas-container");

export const Plugins = [
    new ThreePlugin({canvasContainer})
]