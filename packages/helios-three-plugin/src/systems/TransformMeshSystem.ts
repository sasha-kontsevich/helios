import { defineQuery } from 'bitecs';
import * as THREE from 'three';
import {Position, Rotation, Scale, System} from "@merlinn/helios-core";
import {ThreeMesh, ThreeScene} from "../components";

export class TransformMeshSystem extends System {
    private positionQuery = defineQuery([Position, ThreeMesh]);
    private rotationQuery = defineQuery([Rotation, ThreeMesh]);
    private scaleQuery = defineQuery([Scale, ThreeMesh]);

    update(deltaTime: number): void {

        this.positionQuery(this.world).forEach(eid => {
            const mesh = ThreeMesh.get(eid).mesh;
            if (mesh) {
                mesh.position.set(Position.x[eid], Position.y[eid], Position.z[eid])
            }
        });

        this.rotationQuery(this.world).forEach(eid => {
            const mesh = ThreeMesh.get(eid).mesh;
            if (mesh) {
                mesh.rotation.set(Rotation.x[eid], Rotation.y[eid], Rotation.z[eid]);
            }
        });

        this.scaleQuery(this.world).forEach(eid => {
            const mesh = ThreeMesh.get(eid).mesh;
            if (mesh) {
                mesh.scale.set(Scale.x[eid], Scale.y[eid], Scale.z[eid]);
            }
        });
    }
}
