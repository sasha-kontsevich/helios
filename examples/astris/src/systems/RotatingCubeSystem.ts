import {Context, Position, Rotation, System} from "@merlinn/helios-core";
import { addComponent, addEntity, defineQuery } from "bitecs";
import * as THREE from "three";
import {Rotating} from "../components";
import {ThreeMesh, ThreeScene} from "@merlinn/helios-three-plugin";

export class RotatingCubeSystem extends System {
    private readonly cubeEid: number;
    private query = defineQuery([Rotation, ThreeMesh, Rotating, Position]);

    constructor(context: Context) {
        super(context);

        this.cubeEid = addEntity(this.world);

        addComponent(this.world, Rotating, this.cubeEid);
        addComponent(this.world, Position, this.cubeEid);
        addComponent(this.world, Rotation, this.cubeEid);
        addComponent(this.world, ThreeMesh, this.cubeEid);

        const geometry = new THREE.BoxGeometry(10, 10, 5);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
        ThreeMesh.get(this.cubeEid).mesh = new THREE.Mesh(geometry, material);
    }

    update(deltaTime: number): void {
        this.query(this.world).forEach((eid) => {
            console.log(Position.z[1])
            Rotation.y[eid] += Rotating.speed[eid] * deltaTime / 100;
            Position.get(eid).z += 1 / 100;
        });
    }
}
