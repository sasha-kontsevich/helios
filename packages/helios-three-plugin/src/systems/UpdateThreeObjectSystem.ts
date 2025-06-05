import { defineQuery, hasComponent, IWorld } from 'bitecs';
import {Position, Rotation, Scale, System, Parent, isCyclic} from "@merlinn/helios-core";
import { ThreeObject } from "../components";
import * as THREE from "three";

export class UpdateThreeObjectSystem extends System {
    private objectQuery = defineQuery([ThreeObject]);

    update(deltaTime: number): void {
        const world = this.world;

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
                const object = ThreeObject.get(eid).object;
                const parentEid = Parent.target[eid];
                const cachedParent = Parent.current[eid];

                if (parentEid !== cachedParent && !isCyclic(world, eid, parentEid)) {
                    const parentObject = ThreeObject.get(parentEid)?.object;
                    if (parentObject) {
                        // Удаляем из старого родителя (если есть)
                        if (cachedParent !== 0) {
                            const oldParent = ThreeObject.get(cachedParent)?.object;
                            oldParent?.remove(object);
                        }

                        // Добавляем в нового
                        parentObject.add(object);
                        Parent.current[eid] = parentEid;
                    }
                }
            }
        });
    }
}
