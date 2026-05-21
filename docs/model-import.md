# 3D model import (OBJ / FBX / GLB)

Helios treats **imported files** and **runtime scene data** separately.

## Pipeline

1. **Import** (CLI or editor drop) converts source files to **`model.glb`** + **`model.manifest.json`** under `public/assets/models/<name>/`.
2. **`.meta`** files register GUIDs with `AssetManager` (`loadGltfBinary`, `loadGltfMesh`, `loadGltfMaterial`, `loadModel`).
3. **Scene / spawn** uses core **`ModelInstance`** `{ model: "guid://models/..." }` or **`EngineAPI.spawnModelInstance()`**.
4. Expansion spawns an ECS **entity tree** (`Mesh` + `Geometry` + `Material` + `Parent`); **three-plugin** compiles to `ThreeObject` / `ThreeMesh`.

## Formats

| Input | Import |
|-------|--------|
| **GLB / GLTF** | Copy + manifest generation |
| **OBJ** | Convert to GLB via `obj2gltf` (CLI) or browser export (editor), then manifest |
| **FBX** | **CLI only** — requires `fbx2gltf` in PATH |

## CLI

```bash
pnpm --filter @merlinn/helios-cli run build
node packages/helios-cli/dist/import-model.js path/to/model.obj \
  --out assets/models/my_model \
  --project examples/astris
```

Updates `public/assets/asset-index.json` with manifest, GLB, and sub-asset stub JSON paths.

## Editor

- Left panel **Assets** — list of `loadModel` GUIDs, **На сцену** spawns at selection.
- **Drag & drop** `.glb` / `.obj` on the viewport — preview spawn (preloaded assets); FBX shows CLI hint.
- Inspector **ModelInstance** — edit `model` GUID, **Развернуть на сцене**.

Host hook: `createEditor({ modelImport: { saveModelBundle?, onModelSpawned? } })`.

## Scene JSON example

```json
{
  "id": "prop-1",
  "components": {
    "Name": { "label": "Crate" },
    "ModelInstance": { "model": "guid://models/crate" },
    "Position": { "x": 2, "y": 0, "z": 0 },
    "Parent": { "target": "scene-root" }
  }
}
```

`SceneManager` expands **`ModelInstance`** after loading entities.

## Limits (v1)

- No skinning / animation.
- One `THREE.Mesh` per ECS entity; multi-mesh models use multiple entities.
- Materials come from GLTF (cloned at resolve time).
