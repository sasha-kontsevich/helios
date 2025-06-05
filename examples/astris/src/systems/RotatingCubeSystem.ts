import {Context, Parent, Position, Rotation, System} from "@merlinn/helios-core";
import { addComponent, addEntity, defineQuery } from "bitecs";
import * as THREE from "three";
import {Rotating} from "../components";
import {ThreeMesh, ThreeObject} from "@merlinn/helios-three-plugin";

export class RotatingCubeSystem extends System {
    private query = defineQuery([Rotation, ThreeMesh, Rotating, Position]);

    constructor(context: Context) {
        super(context);

        const eid = addEntity(this.world);

        addComponent(this.world, Rotating, eid);
        addComponent(this.world, Position, eid);
        addComponent(this.world, Rotation, eid);
        addComponent(this.world, ThreeMesh, eid);
        addComponent(this.world, ThreeObject, eid);
        addComponent(this.world, Parent, eid);

        ThreeMesh.get(eid).geometry = new THREE.BoxGeometry(1, 1, 1);
        ThreeMesh.get(eid).material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
        Rotating.speed[eid] = 1;
        Position.get(eid).x = 1;
        Position.get(eid).y = 1;
        Position.get(eid).z = 1;
        Parent.target[eid] = 0;
    }

    update(deltaTime: number): void {
        this.query(this.world).forEach((eid) => {
            Rotation.y[eid] += Rotating.speed[eid] * deltaTime;
        });
    }
}
