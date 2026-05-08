import { Types } from 'bitecs';
import * as THREE from 'three';
import { defineComponent } from "@merlinn/helios-core";

export const ThreeObject = defineComponent({ object: THREE.Object3D.prototype });

export const ThreeMesh = defineComponent({ geometry: THREE.BufferGeometry.prototype, material: THREE.Material.prototype });

export const ThreeCamera = defineComponent({fov: Types.f32, aspect: Types.f32, near: Types.f32, far: Types.f32});

export const ThreeLight = defineComponent({ intensity: Types.f32 });

/** Empty-string schema fields store optional GUID strings via the defineComponent resource proxy. */
const STRING_FIELD = '';

/**
 * Serializable geometry description for scenes/editor (not a live THREE.BufferGeometry).
 * Runtime geometry is written to {@link ThreeMesh}.geometry by `ThreeMeshResourceBuilder`.
 */
export const ThreeGeometryRef = defineComponent({
    guid: STRING_FIELD,
    descriptor: Object.freeze({}) as object,
});

/**
 * Serializable material description for scenes/editor (not a live THREE.Material).
 * Runtime material is written to {@link ThreeMesh}.material by `ThreeMeshResourceBuilder`.
 */
export const ThreeMaterialRef = defineComponent({
    guid: STRING_FIELD,
    descriptor: Object.freeze({}) as object,
});

/**
 * Build state for `ThreeGeometryRef`/`ThreeMaterialRef` → `ThreeMesh` resolution.
 * We cache the last seen descriptor/guid ids so changes can trigger a rebuild.
 */
export const ThreeResourcesBuilt = defineComponent({
    built: Types.ui8,
    geoGuidId: Types.ui32,
    geoDescId: Types.ui32,
    matGuidId: Types.ui32,
    matDescId: Types.ui32,
});
