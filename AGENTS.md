# Instructions for coding agents (Cursor / automation)

This file guides AI assistants and tooling working in the **helios** monorepo.

## Monorepo layout

- **Package manager:** `pnpm` only (`pnpm-lock.yaml`). Do not mix npm lockfiles in the same tree.
- **Workspace:** `packages/*`, `examples/*` (see root `package.json`).

| Area | Path | Role |
|------|------|------|
| ECS core | `packages/helios-core` | Engine, `EngineAPI`, components, spawn/merge entity/component maps, clipboard types |
| Three.js plugin | `packages/helios-three-plugin` | `ThreePlugin`, `ThreeRenderContext`, mesh/camera/light systems, geometry/material descriptors |
| Editor UI | `packages/helios-editor` | Vue shell, inspector, scene view, selection bus, context menus |
| Example game | `examples/astris` | Vite app wiring engine + editor |

Optional packages: `helios-physics-plugin`, `helios-cli` — touch only if the task involves them.

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
- **Selection:** `SelectionBus` in editor context; scene highlights via `EditorSelectionOverlay` + `tryGetEntityThreeObject` (three-plugin).
- **Three capability:** string key `renderer.three` → `ThreeRenderContext`; editor-only nodes under `getEditorRoot()`.
- **Clipboard:** `EditorEntityClipboardV1` — entity paste creates a **new** entity; inspector **Paste** merges onto the **selected** entity via `mergeEntityFromEditorClipboardPayload`.
- **Context menus:** Shared UI in `packages/helios-editor/src/ui/contextMenu/` (`ContextMenu.vue`, `useContextMenu`, viewport clamp in `clampContextMenuToViewport.ts`).

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
