# Fog (scene atmosphere)

Helios uses an ECS entity with **`Fog`** (core) and **`UpdateFogSystem`** (three-plugin) to set `THREE.Scene.fog`.

## Scene JSON

On an environment entity (often alongside **`Skybox`**):

```json
{
  "id": "environment",
  "components": {
    "Fog": {
      "type": "linear",
      "color": 8900331,
      "near": 30,
      "far": 400,
      "density": 0.00025
    }
  }
}
```

| Field | Meaning |
|-------|---------|
| `type` | `"linear"` / `0` → `THREE.Fog(near, far)`; `"exp2"` / `1` → `THREE.FogExp2(density)` |
| `color` | `0xRRGGBB` integer or `"#rrggbb"` |
| `near`, `far` | Linear fog only (world units) |
| `density` | Exponential fog only (typical **0.0001–0.001**) |

One **`Fog`** per scene is enough; multiple entities log a warning and use the first.

## Editor

Select the entity → **Fog** inspector: type, color, near/far or density.

## Runtime

Register **`UpdateFogSystem`** before **`RenderSystem`** (with **`UpdateSkyboxSystem`**).

Without **`Fog`**, `scene.fog` is cleared.
