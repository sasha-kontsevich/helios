import { Types } from "bitecs";
import * as THREE from "three";
import { defineComponent } from "@merlinn/helios-core";

/** Runtime `THREE.Object3D` handle (not serialized in scene JSON). */
export const ThreeObject = defineComponent({ object: THREE.Object3D.prototype });

/** Runtime mesh resource ids resolved from core {@link Geometry} / {@link Material}. */
export const ThreeMesh = defineComponent({
    geometry: Types.ui32,
    material: Types.ui32,
});

/**
 * Build state for core {@link Geometry} / {@link Material} → {@link ThreeMesh} resolution.
 * Caches last seen descriptor/guid ids so changes can trigger a rebuild.
 */
export const MeshResourcesResolved = defineComponent({
    built: Types.ui8,
    geoGuidId: Types.ui32,
    geoDescId: Types.ui32,
    matGuidId: Types.ui32,
    matDescId: Types.ui32,
});
