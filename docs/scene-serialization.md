# Scene serialization (editor-first, hybrid resources)

## Rules

1. **Scene files and prefabs store only serializable data** from **`@merlinn/helios-core`**: numbers, booleans, nested JSON **descriptor** objects, and **GUID strings** resolved through `AssetManager` after `AssetDatabase.indexMeta`.
2. **Do not persist live `THREE.*` objects** or runtime-only ECS components: **`ThreeObject`**, **`ThreeMesh`**, **`MeshResourcesResolved`**. **`EnsureThreeRenderableSystem`** adds the Three runtime markers when core render components are present.
3. **Hybrid model**
   - **Descriptors** (fast iteration): attach **`Geometry`** / **`Material`** with a `descriptor` object (see below). **`ThreeResourceBuildSystem`** / **`createThreeMeshResourceBuilder()`** compile descriptors into THREE instances and write resource ids into **`ThreeMesh.geometry`** / **`ThreeMesh.material`**.
   - **GUID assets** (reuse / pipeline): set `guid` on **`Geometry`** / **`Material`**. The resolver expects loaded resources to be `THREE.BufferGeometry` or `THREE.Material`.
4. **Idempotency & rebuilds**: **`MeshResourcesResolved`** caches internal ids for `guid`/`descriptor` fields; when those change, geometry/material are recreated and the mesh is torn down and rebuilt.

## Core render components (serializable)

| Component | Role |
|-----------|------|
| **`Mesh`** | Tag: entity is drawn as a mesh when **`Geometry`** + **`Material`** are present |
| **`Geometry`** | `guid?`, `descriptor?` — geometry source |
| **`Material`** | `guid?`, `descriptor?` — material source |
| **`Camera`** | `fov`, `near`, `far` — aspect ratio comes from the viewport (three-plugin) |
| **`AmbientLight`** | `intensity` |
| **`DirectionalLight`** | `intensity`, `targetEntity` — use **`DIRECTIONAL_LIGHT_NO_TARGET_ENTITY`** when the light target is not another ECS entity |

Helper: **`meshEntityComponents()`** in `packages/helios-core/src/rendering/meshSpawn.ts` builds a spawn map for mesh entities (no Three runtime fields).

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
| `meshBasic` | `color` (0xRRGGBB), `wireframe?` | |
| `meshLambert` | `color`, `wireframe?`, `emissive?` | `emissive` optional RGB integer |
| `meshStandard` | `color`, `roughness`, `metalness`, `wireframe?` | `roughness` / `metalness` clamped to **0…1** |

### Validation

- Non-finite or out-of-range values are normalized when possible; unrecoverable descriptors log a **warning** and do not set **`MeshResourcesResolved.built = 1`** until resolve succeeds.
