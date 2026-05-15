# @merlinn/helios-input-plugin

Game viewport input for Helios: DOM bridge → `VIEWPORT_INPUT_CAPABILITY` → ECS camera systems.

## Peer dependencies

- `@merlinn/helios-core`
- `@merlinn/helios-three-plugin` (game canvas via `THREE_RENDERER_CAPABILITY`)
- `bitecs`, `three`

## Usage

```ts
import { ViewportInputPlugin, ViewportFlyCameraSystem, ViewportCameraControl } from "@merlinn/helios-input-plugin";

export const Plugins = [
  new ThreePlugin({ editorCanvasId: "helios-editor-view", gameCanvasId: "helios-game-view" }),
  new ViewportInputPlugin(),
];

export const Systems = [
  // …
  ViewportFlyCameraSystem,
  UpdateThreeObjectSystem,
  UpdateThreeCameraSystem,
  RenderSystem,
];
```

Tag the player camera entity with `ViewportCameraControl` in the scene (plus `Position` / `Rotation` / `ThreeCamera`).

## Behaviour

- Listeners attach to the **game** canvas only; editor orbit/fly stays in `helios-editor`.
- When `EDITOR_SHELL_ACTIVE_VIEW_CAPABILITY` is present, input is active only while `activeView === "game"`.
- Fly: RMB + look, WASDQE (+ Shift), same feel as editor `EditorSceneView`.

Orbit (Alt+LMB / MMB) is planned as a follow-up in this package.
