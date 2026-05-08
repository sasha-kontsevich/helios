# Scene serialization (editor-first, hybrid resources)

## Rules

1. **Scene files and prefabs store only serializable data**: numbers, booleans, nested JSON objects for **descriptors**, and **GUID strings** that resolve through `AssetManager` after `AssetDatabase.indexMeta`.
2. **Do not persist live `THREE.*` objects** (`BufferGeometry`, `Material`, `Mesh`, …). Those exist only at runtime on ECS components such as `ThreeMesh` / `ThreeObject`.
3. **Hybrid model**
   - **Descriptors** (fast iteration): attach `ThreeGeometryRef` / `ThreeMaterialRef` with a `descriptor` object (see **Phase 1** below). `ThreeResourceBuildSystem` / `createThreeMeshResourceBuilder()` turns these into real THREE instances and writes them into `ThreeMesh.geometry` / `ThreeMesh.material`.
   - **GUID assets** (reuse / pipeline): set `guid` on `ThreeGeometryRef` / `ThreeMaterialRef`. The resolver calls `assetManager` and expects the loaded resource to be an instance of `THREE.BufferGeometry` or `THREE.Material` (additional loaders/meta may be added later).
4. **Idempotency & rebuilds**: `ThreeResourcesBuilt` caches internal ids for `guid`/`descriptor` fields; when those change, geometry/material are recreated and the mesh is torn down and rebuilt.

## Editor integration points

- Inspectors should edit **descriptor JSON fields** and **GUID strings**, not raw Three objects on `ThreeMesh` (those are runtime caches until an explicit “bake to descriptor/GUID” workflow exists).
- Saving to disk should serialize components that are marked serializable (refs + numeric ECS fields); omit or strip runtime-only proxies.

## Phase 1 — supported `descriptor.type` values

Typed unions and defaults live in `src/builders/descriptors.ts` (`GeometryDescriptor`, `MaterialDescriptor`, `parseGeometryDescriptor`, `parseMaterialDescriptor`).

### `ThreeGeometryRef.descriptor`

| `type` | Parameters | Notes |
|--------|------------|--------|
| `box` | `width`, `height`, `depth` | Must be finite `> 0`. |
| `sphere` | `radius`, `widthSegments`, `heightSegments` | Segments clamped to **≥ 3**. |
| `plane` | `width`, `height`, `widthSegments`, `heightSegments` | Plane segments **≥ 1**. |
| `cylinder` | `radiusTop`, `radiusBottom`, `height`, `radialSegments` | Radii/height `> 0`; radial segments **≥ 3**. |
| `cone` | `radius`, `height`, `radialSegments` | Same clamp rules as above. |
| `torus` | `radius`, `tube`, `radialSegments`, `tubularSegments` | Major/minor radii `> 0`; segments **≥ 3**. |

### `ThreeMaterialRef.descriptor`

| `type` | Parameters | Notes |
|--------|------------|--------|
| `meshBasic` | `color` (0xRRGGBB), `wireframe?` | |
| `meshLambert` | `color`, `wireframe?`, `emissive?` | `emissive` optional RGB integer; omitted unless set. |
| `meshStandard` | `color`, `roughness`, `metalness`, `wireframe?` | `roughness` / `metalness` clamped to **0…1**. |

### Validation

- Non-finite or out-of-range values are normalized when possible; unrecoverable descriptors log a **warning** and do not set `ThreeResourcesBuilt.built = 1` until resolve succeeds.
