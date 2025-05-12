import { defineQuery } from 'bitecs';
import * as THREE from 'three';
import {Context, ISystem} from "@merlinn/helios-core";

export class TransformMeshSystem implements ISystem {
    private positionQuery = defineQuery([]);
    private rotationQuery = defineQuery([]);
    private scaleQuery = defineQuery([]);

    init(context: Context) {
        const Position = context.components.get('Position');
        const Rotation = context.components.get('Rotation');
        const Scale = context.components.get('Scale');
        const Mesh = context.components.get('ThreeMesh');

        this.positionQuery = defineQuery([Position, Mesh]);
        this.rotationQuery = defineQuery([Rotation, Mesh]);
        this.scaleQuery = defineQuery([Scale, Mesh]);
    }

    update(context: Context, deltaTime: number) {
        const Position = context.components.get('Position');
        const Rotation = context.components.get('Rotation');
        const Scale = context.components.get('Scale');
        const Mesh = context.components.get('ThreeMesh');

        const { ecsWorld, resources } = context;

        const positionEntities = this.positionQuery(ecsWorld);

        for (let i = 0; i < positionEntities.length; i++) {
            const eid = positionEntities[i];
            const mesh = resources.get<THREE.Mesh>(Mesh.resourceId[eid]);
            if (!mesh) continue;

            mesh.position.set(
                Position.x[eid],
                Position.y[eid],
                Position.z[eid]
            );
        }

        const rotationEntities = this.positionQuery(ecsWorld);

        for (let i = 0; i < rotationEntities.length; i++) {
            const eid = rotationEntities[i];
            const mesh = resources.get<THREE.Mesh>(Mesh.resourceId[eid]);
            if (!mesh) continue;

            mesh.rotation.set(
                Rotation.x[eid],
                Rotation.y[eid],
                Rotation.z[eid]
            );
        }

        const scaleEntities = this.scaleQuery(ecsWorld);

        for (let i = 0; i < scaleEntities.length; i++) {
            const eid = scaleEntities[i];
            const mesh = resources.get<THREE.Mesh>(Mesh.resourceId[eid]);
            if (!mesh) continue;

            mesh.scale.set(
                Scale.x[eid],
                Scale.y[eid],
                Scale.z[eid]
            );
        }
    }
}
