# Helios

Helios is an experimental ECS web game engine with a Vue editor shell, a Three.js rendering plugin, and an example game/editor project called Astris.

The repo is set up as a pnpm monorepo:

- `packages/helios-core` - ECS engine, components, systems, scene loading, and editor-facing API.
- `packages/helios-three-plugin` - Three.js renderer integration and mesh/camera/light systems.
- `packages/helios-input-plugin` - DOM-to-ECS viewport input bridge.
- `packages/helios-editor` - Vue editor UI, inspector, scene view, systems panel, and play controls.
- `examples/astris` - demo application wiring the packages together.

## Quick Start

Use `pnpm` only for this repository. Do not mix npm lockfiles into the same tree.

```bash
corepack enable
pnpm install
pnpm dev
```

`pnpm dev` starts the Astris Vite app from the repository root. The Astris dev script builds the editor package first, then launches the local demo.

Production demo build:

```bash
pnpm demo:build
```

Full workspace checks:

```bash
pnpm run typecheck
pnpm run build
```

## Demo Walkthrough

When Astris opens, the main things to try are:

- Switch between the editor and game tabs.
- Use the game camera with right mouse button + `WASDQE`; the camera is controlled by an ECS system through the input plugin.
- Press Play to run simulation systems, then Pause to stop simulation while rendering, editor systems, and camera input keep updating.
- Open the Systems panel and watch `updateActive` / pause state change with Play and Pause.
- Select an entity and edit `Rotation` in the Inspector: the UI shows Euler XYZ degrees, while ECS stores the raw quaternion.
- Inspect the Game of Life scene and cube rotation as examples of simulation systems.

## Demo Smoke Checklist

Before showing the repository:

- `pnpm install` completes without changing lockfiles unexpectedly.
- `pnpm dev` starts Astris from the root.
- Editor/Game tab switching works.
- RMB + `WASDQE` moves the game camera without roll.
- Play/Pause stops simulation systems while render and camera remain responsive.
- Systems panel reflects active and paused system state.
- Inspector Rotation edits are stable in Euler UI and stored as quaternion fields.
- `pnpm run typecheck` and `pnpm demo:build` pass.

## Editor Package API

```ts
import { createEditor } from "@merlinn/helios-editor";
import "@merlinn/helios-editor/style.css";

const ui = createEditor({ api: engine.api, root: document.getElementById("editor-root")! });
ui.dispose();
```

The editor package expects peer dependencies from this workspace: `vue`, `@merlinn/helios-core`, `@merlinn/helios-three-plugin`, and `three`.

## Status

Helios is demo-ready but not production-ready yet. The current goal is to show the engine/editor architecture, ECS-driven gameplay, package boundaries, and editor workflows clearly. APIs may still change as the engine matures.

## Documentation

- [docs/README.md](docs/README.md) - documentation index.
- [docs/overview.md](docs/overview.md) - package overview and data flow.
- [docs/architecture.md](docs/architecture.md) - detailed architecture for core, editor, Three.js, input, and Astris.
- [docs/maintaining-documentation.md](docs/maintaining-documentation.md) - documentation update checklist.
- [AGENTS.md](AGENTS.md) - conventions for automation and coding agents.
