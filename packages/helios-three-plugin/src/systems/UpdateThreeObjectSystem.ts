import { defineQuery, hasComponent } from "bitecs";
import { Parent, Position, Rotation, Scale, System, isCyclic } from "@merlinn/helios-core";
import * as THREE from "three";
import { ThreeObject } from "../components";
import { getThreeRenderContext } from "../ThreeRenderContext";

export class UpdateThreeObjectSystem extends System {
    static override readonly systemName = "UpdateThreeObjectSystem";
    static override readonly systemDescription = "Syncs ECS transform to ThreeObject.";
    static override readonly runsInEditor = true;

    private readonly objectQuery = defineQuery([ThreeObject]);

    update(deltaTime: number): void {
        const world = this.world;
        const root = getThreeRenderContext(this.context).getWorldRoot();

        this.objectQuery(world).forEach(eid => {
            const { object } = ThreeObject.get(eid);
            if (!object) return;

            // --- Обновляем позицию ---
            if (hasComponent(world, Position, eid)) {
                object.position.set(Position.x[eid], Position.y[eid], Position.z[eid]);
            }

            // --- Обновляем вращение ---
            if (hasComponent(world, Rotation, eid)) {
                object.quaternion.set(
                    Rotation.x[eid],
                    Rotation.y[eid],
                    Rotation.z[eid],
                    Rotation.w[eid],
                );
            }

            // --- Обновляем масштаб ---
            if (hasComponent(world, Scale, eid)) {
                object.scale.set(Scale.x[eid], Scale.y[eid], Scale.z[eid]);
            }

            // --- Обновляем иерархию ---
            if (hasComponent(world, Parent, eid)) {
                const parentEid = Parent.target[eid];
                let parentObject = ThreeObject.get(parentEid).object as THREE.Object3D | undefined;
                if (!parentObject && parentEid > 0) {
                    const group = new THREE.Group();
                    ThreeObject.get(parentEid).object = group;
                    if (!group.parent) {
                        root.add(group);
                    }
                    parentObject = group;
                }

                if (
                    parentObject &&
                    object.parent !== parentObject &&
                    !isCyclic(world, eid, parentEid)
                ) {
                    if (object.parent) {
                        object.parent.remove(object);
                    } else {
                        root.remove(object);
                    }

                    parentObject.add(object);
                    Parent.current[eid] = parentEid;
                }
            }
        });
    }
}
