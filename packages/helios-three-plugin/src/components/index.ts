import { Types } from 'bitecs';
import * as THREE from 'three';
import {defineComponent} from "@merlinn/helios-core";

export const ThreeObject = defineComponent({ object: THREE.Object3D.prototype });

export const ThreeMesh = defineComponent({ geometry: THREE.BufferGeometry.prototype, material: THREE.Material.prototype });

export const ThreeCamera = defineComponent({fov: Types.f32, aspect: Types.f32, near: Types.f32, far: Types.f32});

export const ThreeLight = defineComponent({ intensity: Types.f32 });

export const ThreeScene = defineComponent({ scene: THREE.Scene.prototype });

export const ThreeRenderer = defineComponent({ renderer: THREE.WebGLRenderer.prototype, canvasId: "", canvas: HTMLCanvasElement.prototype });
