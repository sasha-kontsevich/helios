import * as THREE from "three";
import type { GeometryDescriptor, MaterialDescriptor } from "@merlinn/helios-core";

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

export function createMaterialFromDescriptor(desc: MaterialDescriptor): THREE.Material | null {
    try {
        switch (desc.type) {
            case "meshBasic":
                return new THREE.MeshBasicMaterial({
                    color: desc.color,
                    wireframe: desc.wireframe ?? false,
                });
            case "meshLambert": {
                const opts: THREE.MeshLambertMaterialParameters = {
                    color: desc.color,
                    wireframe: desc.wireframe ?? false,
                };
                if (desc.emissive !== undefined) opts.emissive = desc.emissive;
                return new THREE.MeshLambertMaterial(opts);
            }
            case "meshStandard":
                return new THREE.MeshStandardMaterial({
                    color: desc.color,
                    roughness: desc.roughness,
                    metalness: desc.metalness,
                    wireframe: desc.wireframe ?? false,
                });
            default:
                return null;
        }
    } catch {
        return null;
    }
}
