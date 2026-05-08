import { defineQuery, hasComponent } from 'bitecs';
import { Parent, Position, Rotation, Scale, System, isCyclic } from "@merlinn/helios-core";
import { ThreeObject } from "../components";
import { getThreeRenderContext } from "../ThreeRenderContext";

export class UpdateThreeObjectSystem extends System {
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
                object.rotation.set(Rotation.x[eid], Rotation.y[eid], Rotation.z[eid]);
            }

            // --- Обновляем масштаб ---
            if (hasComponent(world, Scale, eid)) {
                object.scale.set(Scale.x[eid], Scale.y[eid], Scale.z[eid]);
            }

            // --- Обновляем иерархию ---
            if (hasComponent(world, Parent, eid)) {
                const parentEid = Parent.target[eid];
                const parentObject = ThreeObject.get(parentEid).object;

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
