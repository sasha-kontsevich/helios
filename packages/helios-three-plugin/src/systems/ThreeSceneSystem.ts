import { defineQuery, exitQuery } from "bitecs";
import { System } from "@merlinn/helios-core";
import { ThreeObject } from '../components';
import { getThreeRenderContext } from "../ThreeRenderContext";

export class ThreeSceneSystem extends System {
    private readonly query = defineQuery([ThreeObject]);
    private readonly objectExitQuery = exitQuery(this.query);

    update(deltaTime: number) {
        const root = getThreeRenderContext(this.context).getWorldRoot();

        this.query(this.world).forEach(entity => {
            const object = ThreeObject.get(entity).object;

            if (!object.parent) {
                root.add(object);
            }
        });

        this.objectExitQuery(this.world).forEach(entity => {
            const object = ThreeObject.get(entity).object;

            object.parent?.remove(object);
        });
    }
}
