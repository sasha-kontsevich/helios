# Texture assets

Helios maps **texture files** to ECS materials through **GUID assets** referenced from **`Material.descriptor`** fields.

## Asset layout

Place images under `public/assets/textures/` (or any path listed in `asset-index.json`) with a sidecar **`.meta`**:

```json
{
  "guid": "guid://textures/brick_albedo",
  "type": "texture",
  "loader": "loadTexture",
  "dependencies": []
}
```

Register the file in **`public/assets/asset-index.json`**:

```json
"textures/brick_albedo.png"
```

At runtime `AssetDatabase.indexMeta` reads `textures/brick_albedo.png.meta` and registers `loader: "loadTexture"` (implemented in **helios-three-plugin**).

## Scene / prefab usage

On any entity with **`Material`**, set descriptor slots to texture GUIDs:

```json
"Material": {
  "descriptor": {
    "type": "meshStandard",
    "color": 16777215,
    "roughness": 0.8,
    "metalness": 0.1,
    "map": "guid://textures/brick_albedo",
    "normalMap": "guid://textures/brick_normal"
  }
}
```

| Material type | Texture slots |
|---------------|----------------|
| `meshBasic` | `map` |
| `meshLambert` | `map`, `emissiveMap` |
| `meshStandard` | `map`, `normalMap`, `roughnessMap`, `metalnessMap`, `aoMap`, `emissiveMap` |

`SceneManager` preloads all texture GUIDs referenced in the scene entity list before spawn. **`ThreeResourceBuildSystem`** loads missing textures asynchronously, then rebuilds the material.

## Editor

- Вкладка **Assets → Текстуры** — список `loadTexture` GUID, кнопки **GUID** (копировать) и **На map** (в `Material.descriptor` выбранной сущности).
- Перетащите **.png / .jpg / .webp** во вьюпорт (в Astris dev — сохранение на диск через `POST /__helios/save-texture`).
- **Material** inspector (non-raw mode) — слоты **Textures (GUID)** для `normalMap`, `aoMap`, и т.д.

## Sample (Astris)

- `public/assets/textures/checker.png` + `.meta` → `guid://textures/checker`
- Demo cube in `scenes/main.json` uses `"map": "guid://textures/checker"`
- Regenerate PNG: `node examples/astris/scripts/gen-checker-texture.mjs`

## Imported GLTF models

Materials from **`loadGltfMaterial`** keep embedded GLTF textures; descriptor texture slots apply to **procedural / scene-authored** `Material.descriptor` materials, not sub-assets of imported meshes (use `Material.guid` for those).

## Notes

- Albedo / emissive maps use **sRGB**; normal/roughness/metalness/AO use **linear** color space on the Three.js texture (`flipY = false` for data maps, as in glTF).
- **`aoMap`** in Three.js reads the **`uv2`** attribute. Helios copies **`uv` → `uv2`** when the mesh has no second UV set (same as many Unity FBX/OBJ imports).
- Export normal maps from Unity as **PNG** (type Normal map), not via PSD→ImageMagick — composite PSD layers can break tangent-space normals.
- Supported loaders: PNG, JPG, and other formats **`THREE.TextureLoader`** accepts via URL.

### Unity vs Helios checklist

| Unity (URP Lit) | Helios `meshStandard` descriptor |
|-----------------|----------------------------------|
| Base Map | `map` (optional; white `color` ≈ Base Map tint) |
| Normal Map | `normalMap` |
| Occlusion Map | `aoMap` |
| Metallic / Smoothness | `metalness` / `roughness` (smoothness ≈ `1 - roughness`) |
