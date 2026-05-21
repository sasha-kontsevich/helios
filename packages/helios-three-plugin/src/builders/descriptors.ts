import type { GeometryDescriptor } from "@merlinn/helios-core";
import * as THREE from "three";

export {
    buildMaterialFromDescriptor,
    createMaterialFromDescriptor,
    createTextureResolver,
} from "./materialFromDescriptor";

export function createGeometryFromDescriptor(desc: GeometryDescriptor): THREE.BufferGeometry | null {
    try {
        switch (desc.type) {
            case "box":
                return new THREE.BoxGeometry(desc.width, desc.height, desc.depth);
            case "sphere":
                return new THREE.SphereGeometry(desc.radius, desc.widthSegments, desc.heightSegments);
            case "plane":
                return new THREE.PlaneGeometry(desc.width, desc.height, desc.widthSegments, desc.heightSegments);
            case "cylinder":
                return new THREE.CylinderGeometry(
                    desc.radiusTop,
                    desc.radiusBottom,
                    desc.height,
                    desc.radialSegments,
                );
            case "cone":
                return new THREE.ConeGeometry(desc.radius, desc.height, desc.radialSegments);
            case "torus":
                return new THREE.TorusGeometry(desc.radius, desc.tube, desc.radialSegments, desc.tubularSegments);
            default:
                return null;
        }
    } catch {
        return null;
    }
}
