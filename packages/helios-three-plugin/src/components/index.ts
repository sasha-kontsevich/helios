import { Types } from 'bitecs';
import * as THREE from 'three';
import {defineComponent} from "@merlinn/helios-core";

export const ThreeMesh = defineComponent({ mesh: THREE.Mesh.prototype });

export const ThreeCamera = defineComponent({camera: THREE.Camera.prototype});

export const ThreeLight = defineComponent({ light: THREE.Light.prototype });

export const ThreeScene = defineComponent({ scene: THREE.Scene.prototype });

export const ThreeRenderer = defineComponent({ renderer: THREE.WebGLRenderer.prototype, canvasId: "" });
