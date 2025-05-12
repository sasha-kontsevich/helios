import {Context} from "@merlinn/helios-core";
import {
    ThreeMesh,
    ThreeCamera,
    ThreeLight,
    ThreeRenderer,
    ThreeScene
} from "@merlinn/helios-three-plugin";

export function initComponents(context: Context) {
    context.components.register('ThreeMesh', ThreeMesh);
    context.components.register('ThreeCamera', ThreeCamera);
    context.components.register('ThreeScene', ThreeScene);
    context.components.register('ThreeRenderer', ThreeRenderer);
    context.components.register('ThreeLight', ThreeLight);
}
