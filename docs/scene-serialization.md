# Scene serialization (editor-first, hybrid resources)

## Rules

1. **Scene files and prefabs store only serializable data** from **`@merlinn/helios-core`**: numbers, booleans, nested JSON **descriptor** objects, and **GUID strings** resolved through `AssetManager` after `AssetDatabase.indexMeta`.
2. **Do not persist live `THREE.*` objects** or runtime-only ECS components: **`ThreeObject`**, **`ThreeMesh`**, **`MeshResourcesResolved`**. **`EnsureThreeRenderableSystem`** adds the Three runtime markers when core render components are present.
3. **Hybrid model**
   - **Descriptors** (fast iteration): attach **`Geometry`** / **`Material`** with a `descriptor` object (see below). **`ThreeResourceBuildSystem`** / **`createThreeMeshResourceBuilder()`** compile descriptors into THREE instances and write resource ids into **`ThreeMesh.geometry`** / **`ThreeMesh.material`**.
   - **GUID assets** (reuse / pipeline): set `guid` on **`Geometry`** / **`Material`**. The resolver expects loaded resources to be `THREE.BufferGeometry` or `THREE.Material`.
4. **Idempotency & rebuilds**: **`MeshResourcesResolved`** caches internal ids for `guid`/`descriptor` fields; when those change, geometry/material on the live **`THREE.Mesh`** are swapped in place and stale tagged orphans are removed from the scene graph.

## Core render components (serializable)

| Component | Role |
|-----------|------|
| **`Mesh`** | Tag: entity is drawn as a mesh when **`Geometry`** + **`Material`** are present |
| **`Geometry`** | `guid?`, `descriptor?` — geometry source |
| **`Material`** | `guid?`, `descriptor?` — material source |
| **`Camera`** | `fov`, `near`, `far` — aspect ratio comes from the viewport (three-plugin) |
| **`AmbientLight`** | `intensity` |
| **`DirectionalLight`** | `intensity`, `targetEntity` — use **`DIRECTIONAL_LIGHT_NO_TARGET_ENTITY`** when the light target is not another ECS entity |
| **`Skybox`** | `texture` — GUID of equirectangular texture (`loadTexture`); see **[skybox.md](skybox.md)** |
| **`ModelInstance`** | `model` — GUID of a **`ModelManifest`** asset (`loadModel`); expanded to a mesh hierarchy on scene load / Play snapshot restore |

Helper: **`meshEntityComponents()`** in `packages/helios-core/src/rendering/meshSpawn.ts` builds a spawn map for mesh entities (no Three runtime fields).

Imported models use **`Geometry.guid`** / **`Material.guid`** on sub-assets (`loadGltfMesh`, `loadGltfMaterial`) — see **[model-import.md](model-import.md)**.

Typed unions and parsers: **`packages/helios-core/src/rendering/descriptors.ts`** (`GeometryDescriptor`, `MaterialDescriptor`, `parseGeometryDescriptor`, `parseMaterialDescriptor`).

## Editor integration

- Inspectors edit **descriptor JSON** and **GUID strings** on **`Geometry`** / **`Material`**, not raw Three objects on **`ThreeMesh`**.
- Clipboard / save omit runtime-only components (see **`stripRuntimeFieldsForEntityClipboard`**).

## Supported `descriptor.type` values

### `Geometry.descriptor`

| `type` | Parameters | Notes |
|--------|------------|--------|
| `box` | `width`, `height`, `depth` | Must be finite `> 0`. |
| `sphere` | `radius`, `widthSegments`, `heightSegments` | Segments clamped to **≥ 3**. |
| `plane` | `width`, `height`, `widthSegments`, `heightSegments` | Plane segments **≥ 1**. |
| `cylinder` | `radiusTop`, `radiusBottom`, `height`, `radialSegments` | Radii/height `> 0`; radial segments **≥ 3**. |
| `cone` | `radius`, `height`, `radialSegments` | Same clamp rules as above. |
| `torus` | `radius`, `tube`, `radialSegments`, `tubularSegments` | Major/minor radii `> 0`; segments **≥ 3**. |

### `Material.descriptor`

| `type` | Parameters | Notes |
|--------|------------|--------|
| `meshBasic` | `color` (0xRRGGBB), `wireframe?`, `map?` | `map` = texture asset GUID |
| `meshLambert` | `color`, `wireframe?`, `emissive?`, `map?`, `emissiveMap?` | `emissive` optional RGB integer |
| `meshStandard` | `color`, `roughness`, `metalness`, `wireframe?`, `map?`, `normalMap?`, `roughnessMap?`, `metalnessMap?`, `aoMap?`, `emissiveMap?` | `roughness` / `metalness` clamped to **0…1** |

Texture assets (`loader: "loadTexture"`) and slot names — **[textures.md](textures.md)**.

### Validation

- Non-finite or out-of-range values are normalized when possible; unrecoverable descriptors log a **warning** and do not set **`MeshResourcesResolved.built = 1`** until resolve succeeds.
