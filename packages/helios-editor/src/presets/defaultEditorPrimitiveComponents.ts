import {
    meshEntityComponents,
    quatFromEulerXYZ,
    type GeometryDescriptor,
    type MaterialDescriptor,
} from "@merlinn/helios-core";

/**
 * Default mesh primitives for the editor (descriptors from {@link @merlinn/helios-core} rendering defaults).
 * Plane is rotated -90° around X so it lies on XZ.
 */

export const EDITOR_PRIMITIVE_KINDS = ["box", "sphere", "plane", "cylinder", "cone", "torus"] as const;
export type EditorPrimitiveKind = (typeof EDITOR_PRIMITIVE_KINDS)[number];

/** Russian labels for {@link Name} when spawning primitives from the editor context menu. */
export const EDITOR_PRIMITIVE_NAME_LABELS: Record<EditorPrimitiveKind, string> = {
  box: "Box",
  sphere: "Sphere",
  plane: "Plane",
  cylinder: "Cylinder",
  cone: "Cone",
  torus: "Torus",
};

const DEFAULT_MATERIAL = {
  type: "meshStandard" as const,
  color: 0xffffff,
  roughness: 0.55,
  metalness: 0.15,
  wireframe: false,
};

function geometryDescriptor(kind: EditorPrimitiveKind): Record<string, unknown> {
  switch (kind) {
    case "box":
      return { type: "box", width: 1, height: 1, depth: 1 };
    case "sphere":
      return { type: "sphere", radius: 1, widthSegments: 32, heightSegments: 16 };
    case "plane":
      return { type: "plane", width: 1, height: 1, widthSegments: 1, heightSegments: 1 };
    case "cylinder":
      return { type: "cylinder", radiusTop: 1, radiusBottom: 1, height: 1, radialSegments: 32 };
    case "cone":
      return { type: "cone", radius: 1, height: 1, radialSegments: 32 };
    case "torus":
      return { type: "torus", radius: 1, tube: 0.4, radialSegments: 16, tubularSegments: 48 };
  }
}

/** Center y so volumetric primitives sit on y=0 grid; plane origin stays at y=0. */
function positionFor(kind: EditorPrimitiveKind): { x: number; y: number; z: number } {
  if (kind === "plane") {
    return { x: 0, y: 0, z: 0 };
  }
  return { x: 0, y: 0.5, z: 0 };
}

function rotationFor(kind: EditorPrimitiveKind): { x: number; y: number; z: number; w: number } {
  const euler =
    kind === "plane"
      ? { x: -Math.PI / 2, y: 0, z: 0 }
      : { x: 0, y: 0, z: 0 };
  return quatFromEulerXYZ(euler.x, euler.y, euler.z);
}

export function defaultEditorPrimitiveComponents(kind: EditorPrimitiveKind): Record<string, Record<string, unknown>> {
  return meshEntityComponents({
    geometry: geometryDescriptor(kind) as unknown as GeometryDescriptor,
    material: { ...DEFAULT_MATERIAL } as MaterialDescriptor,
    name: { label: EDITOR_PRIMITIVE_NAME_LABELS[kind] },
    position: positionFor(kind),
    rotation: rotationFor(kind),
  });
}
