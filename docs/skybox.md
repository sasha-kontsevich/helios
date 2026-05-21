# Skybox (scene background)

Helios uses an ECS entity with **`Skybox`** (core) and **`UpdateSkyboxSystem`** (three-plugin) to set `THREE.Scene.background` from a texture GUID.

## What to download

| Format | Status | Notes |
|--------|--------|--------|
| **Equirectangular JPG or PNG** | **Supported** | One file, **2:1** aspect (e.g. 4096×2048, 8192×4096). |
| **HDR (.hdr`, RGBE)** | **Supported** | `loader: loadHdr` in `.meta` (e.g. Poly Haven HDRIs). Prefer **4096×2048** for web (~25MB); 10K originals are heavy in the browser. |
| **EXR** | Not yet | Needs EXR loader (future). |
| **Cubemap (6 faces)** | Not yet | Needs dedicated loader (future). |

Sources: [Poly Haven](https://polyhaven.com/hdris), [ambientCG](https://ambientcg.com/) — pick **equirectangular** PNG/JPG for Helios today.

## Asset setup

Same as [textures.md](textures.md): `public/assets/textures/…`, `.meta` with `loader: "loadTexture"`, entry in `asset-index.json`.

## Scene JSON

Add an entity (often under `scene-root`, no mesh required):

```json
{
  "id": "environment",
  "components": {
    "Name": { "label": "Environment" },
    "Parent": { "target": "scene-root" },
    "Skybox": { "texture": "guid://textures/my_sky" }
  }
}
```

- **`Skybox.texture`** — GUID of the equirect texture asset.
- One skybox per scene is enough; if several entities have **`Skybox`**, the system uses the **first** and logs a warning.
- **`SceneManager`** preloads texture GUIDs from **`Skybox`** and **`Material.descriptor`** before spawn.

Without any **`Skybox`** entity, the background stays **`ThreePlugin` `backgroundColor`** (default `#333333`).

## Runtime

Register **`UpdateSkyboxSystem`** before **`RenderSystem`** (`examples/astris/src/systems/index.ts`).

The skybox is **not** a mesh in `worldRoot` — three-plugin applies the panorama to **`scene.background`** (no extra draw call).
