# @merlinn/helios-input-plugin

Game viewport input bridge for Helios. The package does **not** implement camera/gameplay behavior; it only writes DOM input into an ECS singleton component.

## Peer dependencies

- `@merlinn/helios-core`
- `@merlinn/helios-three-plugin` (game canvas via `THREE_RENDERER_CAPABILITY`)
- `bitecs`

## Usage

```ts
import { ViewportInputPlugin } from "@merlinn/helios-input-plugin";

export const Plugins = [
  new ThreePlugin({ editorCanvasId: "helios-editor-view", gameCanvasId: "helios-game-view" }),
  new ViewportInputPlugin(),
];
```

Consumers read the singleton entity through `getViewportInputEntity(context)` and the `ViewportInput` component:

```ts
const inputEid = getViewportInputEntity(this.context);
const keys = ViewportInput.keys[inputEid];
const rightMouse = (ViewportInput.buttons[inputEid] & ViewportInputButton.Right) !== 0;
```

Call `clearViewportInputFrame(inputEid)` after consuming `lookDeltaX/Y`.

## Component

`ViewportInput` fields:

- `enabled`: `1` when game viewport owns input, otherwise `0`
- `keys`: bitmask (`ViewportInputKey.W/A/S/D/Q/E/Shift/Alt`)
- `buttons`: bitmask (`ViewportInputButton.Left/Middle/Right`)
- `lookDeltaX`, `lookDeltaY`: accumulated mouse movement for the current frame

When `EDITOR_SHELL_ACTIVE_VIEW_CAPABILITY` exists, input is enabled only while `activeView === "game"`. Without that capability (standalone), input stays enabled.
