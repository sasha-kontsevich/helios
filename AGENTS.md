# Instructions for coding agents (Cursor / automation)

This file guides AI assistants and tooling working in the **helios** monorepo.

## Monorepo layout

- **Package manager:** `pnpm` only (`pnpm-lock.yaml`). Do not mix npm lockfiles in the same tree.
- **Workspace:** `packages/*`, `examples/*` (see root `package.json`).

| Area | Path | Role |
|------|------|------|
| ECS core | `packages/helios-core` | Engine, `EngineAPI`, components, **`rendering/`** (descriptors, `Geometry`/`Material`/`Mesh`/`Camera`/lights), spawn maps, clipboard types |
| Three.js plugin | `packages/helios-three-plugin` | `ThreePlugin`, `ThreeRenderContext`, `EnsureThreeRenderable`, compile descriptors → `ThreeMesh` / `ThreeObject` |
| Input plugin | `packages/helios-input-plugin` | `ViewportInputPlugin`, ECS `ViewportInput` singleton, `game.viewportInput` metadata |
| Editor UI | `packages/helios-editor` | Vue shell, inspector, scene view, selection bus, context menus |
| Example game | `examples/astris` | Vite app wiring engine + editor + input plugin |

Optional packages: `helios-physics-plugin`, **`helios-cli`** (`helios import-model` for OBJ/FBX/GLB → bundle) — touch only if the task involves them.

## Commands

```bash
pnpm install
pnpm run typecheck          # all workspaces that define typecheck
pnpm --filter @merlinn/helios-core run build      # refresh dist + .d.ts after API changes
pnpm --filter @merlinn/helios-editor run typecheck
pnpm --filter astris build   # editor build + astris production bundle
```

After changing **`helios-core` public surface** (`EngineAPI`, exports), run **`pnpm run build`** in `packages/helios-core` so `dist/` typings match for packages that resolve types from `dist` (not only source).

## Architecture hints

- **Editor entry:** `createEditor({ api, root })` in `packages/helios-editor` — mounts Vue shell, `EditorSceneView`, selection overlay; `attachEngine(engine)` after `engine.init()`.
- **Asset load status bar:** bottom of `EditorShell` — poll via `EngineAPI.getAssetLoadStatus()` / `subscribeAssetLoadStatus()` (indexing, scene load, in-flight `loadAsset`).
- **Welcome guide:** first visit modal + **?** on the center tab strip; `createEditor({ welcomeGuide: { extraSections } })`; dismiss via `localStorage` key `helios.editor.guideDismissed.v1`.
- **Selection:** `SelectionBus` in editor context; scene highlights via `EditorSelectionOverlay` + `tryGetEntityThreeObject` (three-plugin).
- **Three capability:** string key `renderer.three` → `ThreeRenderContext`; editor-only nodes under `getEditorRoot()`.
- **Clipboard:** `EditorEntityClipboardV1` — entity paste creates a **new** entity; inspector **Paste** merges onto the **selected** entity via `mergeEntityFromEditorClipboardPayload`.
- **Systems panel:** left column tab **Systems**; data from `EngineAPI.listSystemRuntimeSnapshots()`. Every `System` subclass must declare **`static readonly systemName`** (stable id; survives minification) and optional **`systemDescription`** (tooltip in the panel). Editor host calls `applyEditorSystemHostPolicy()` on attach — simulation systems stay **disabled** (no `start`) until Play; render/Three systems use `runsInEditor = true`. Game pause uses `EngineAPI.setSimulationPaused()` and makes simulation `updateActive = false` without stopping systems.
- **Context menus:** Shared UI in `packages/helios-editor/src/ui/contextMenu/` (`ContextMenu.vue`, `useContextMenu`, viewport clamp in `clampContextMenuToViewport.ts`).
- **Game viewport input/camera:** `ViewportInputPlugin` after `ThreePlugin`; game code reads ECS `ViewportInput`. In Astris, `AstrisFlyCameraSystem` runs before `UpdateThreeObjectSystem`; tag camera with `AstrisFlyCamera` in scene JSON.
- **Astris ship motion (Play only):** `ShipOrbit` + `ShipBob` + `ShipSway` on the `ModelInstance` marker (`lp-prop`); `expandModelInstanceMarker` copies extra registered components to the model wrapper. Systems: `ShipOrbitSystem`, `ShipBobSystem`, `ShipSwayRotationSystem` (`runsInEditor = false`).
- **Game UI (HUD):** `GameUiPlugin` + `createEditor({ gameUiPlugins })` — overlays on game canvas, not `EditorPlugin`. Astris: `examples/astris/src/gameUi/AstrisGameHudPlugin.ts`.
- **Rotation:** ECS stores quaternion (`Rotation.x/y/z/w`); inspector shows Euler XYZ. Legacy scene JSON with 3 euler fields migrates at spawn.
- **Scene JSON:** core render components only (`Mesh`, `Geometry`, `Material`, `Camera`, lights, `Skybox`, `Fog`) — no `ThreeObject` / `ThreeMesh` in spawn maps; see **`docs/scene-serialization.md`**. New core components must be **re-exported** from `examples/<game>/src/components/index.ts` or spawn/inspector will skip them.
- **3D models:** import → `public/assets/models/<name>/` (`*.glb` + `*.manifest.json`); scene marker **`ModelInstance`** expands via **`EngineAPI.expandAllModelInstances`** / **`SceneManager.loadScene`**. CLI: `pnpm --filter @merlinn/helios-cli run build` then `node packages/helios-cli/dist/import-model.js … --out assets/models/<name> --project examples/astris`. Details: **`docs/model-import.md`**.

## Conventions

- Prefer **small, focused diffs**; match existing naming and patterns in touched files.
- Do **not** edit user-attached **plan files** under `.cursor/plans/` unless the user explicitly asks.
- Russian UI strings in the editor are acceptable where the rest of the UI already mixes RU/EN.

## Documentation (keep in sync)

When a change affects **public API**, **package boundaries**, **editor UX flows**, or **root scripts / workspaces**, update the docs **in the same PR or commit**—see **[docs/maintaining-documentation.md](docs/maintaining-documentation.md)** for the code→file matrix and a short PR checklist. Detailed architecture lives in **[docs/architecture.md](docs/architecture.md)**.

## Further reading

- [docs/README.md](docs/README.md) — index of all documentation.
- [docs/overview.md](docs/overview.md) — short overview of packages and data flow.
- [docs/architecture.md](docs/architecture.md) — detailed architecture.
