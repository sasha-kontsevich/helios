import { defineQuery, enterQuery, entityExists, exitQuery } from 'bitecs';
import { System } from '@merlinn/helios-core';
import * as THREE from 'three';
import {
    THREE_DIRECTIONAL_LIGHT_NO_TARGET_ENTITY,
    ThreeAmbientLight,
    ThreeDirectionalLight,
    ThreeObject,
} from '../components';
import { getThreeRenderContext } from '../ThreeRenderContext';
import { clearEntityPickingTag, tagObject3DForEntityPicking } from '../picking/tagThreeObjectForPicking';

/**
 * Instantiates THREE lights for {@link ThreeAmbientLight} / {@link ThreeDirectionalLight} + {@link ThreeObject}.
 * Scenes must define lights in data (no engine bootstrap).
 */
export class UpdateThreeLightSystem extends System {
    private readonly ambientQuery = defineQuery([ThreeAmbientLight, ThreeObject]);
    private readonly ambientEnter = enterQuery(this.ambientQuery);
    private readonly ambientExit = exitQuery(this.ambientQuery);

    private readonly directionalQuery = defineQuery([ThreeDirectionalLight, ThreeObject]);
    private readonly directionalEnter = enterQuery(this.directionalQuery);
    private readonly directionalExit = exitQuery(this.directionalQuery);

    update(): void {
        const world = this.world;
        const root = getThreeRenderContext(this.context).getWorldRoot();

        this.ambientEnter(world).forEach((eid) => {
            if (ThreeObject.get(eid).object) return;
            const i = ThreeAmbientLight.intensity[eid] ?? 1;
            const amb = new THREE.AmbientLight(0xffffff, i);
            ThreeObject.get(eid).object = amb;
            tagObject3DForEntityPicking(amb, eid);
        });

        this.directionalEnter(world).forEach((eid) => {
            if (ThreeObject.get(eid).object) return;
            const intensity = ThreeDirectionalLight.intensity[eid] ?? 1;
            const light = new THREE.DirectionalLight(0xffffff, intensity);
            light.position.set(0, 0, 0);

            const rawTarget = ThreeDirectionalLight.targetEntity[eid];
            /** `0` = field omitted in scene JSON (do not bind to eid 0). Use {@link THREE_DIRECTIONAL_LIGHT_NO_TARGET_ENTITY} for explicit “no ECS target”. */
            const useExplicitTarget =
                rawTarget !== THREE_DIRECTIONAL_LIGHT_NO_TARGET_ENTITY &&
                rawTarget !== 0 &&
                entityExists(world, rawTarget);

            if (useExplicitTarget) {
                light.target.position.set(0, 0, 0);
                ThreeObject.get(rawTarget).object = light.target;
                tagObject3DForEntityPicking(light.target, rawTarget);
            } else {
                light.target.position.set(0, 0, 0);
                root.add(light.target);
                (light.userData as { heliosImplicitTarget?: boolean }).heliosImplicitTarget = true;
            }

            ThreeObject.get(eid).object = light;
            tagObject3DForEntityPicking(light, eid);
        });

        this.ambientQuery(world).forEach((eid) => {
            const obj = ThreeObject.get(eid).object;
            if (!obj || !(obj instanceof THREE.AmbientLight)) return;
            obj.intensity = ThreeAmbientLight.intensity[eid] ?? 1;
        });

        this.directionalQuery(world).forEach((eid) => {
            const obj = ThreeObject.get(eid).object;
            if (!obj || !(obj instanceof THREE.DirectionalLight)) return;
            obj.intensity = ThreeDirectionalLight.intensity[eid] ?? 1;
        });

        this.ambientExit(world).forEach((eid) => {
            const obj = ThreeObject.get(eid).object as THREE.Object3D | undefined;
            if (obj) {
                clearEntityPickingTag(obj);
                obj.parent?.remove(obj);
            }
            (ThreeObject as any).object[eid] = 0;
        });

        this.directionalExit(world).forEach((eid) => {
            const obj = ThreeObject.get(eid).object as THREE.DirectionalLight | undefined;
            if (obj instanceof THREE.DirectionalLight) {
                clearEntityPickingTag(obj);
                const implicit = (obj.userData as { heliosImplicitTarget?: boolean }).heliosImplicitTarget;
                if (implicit) {
                    obj.target.parent?.remove(obj.target);
                }
                obj.parent?.remove(obj);
            }
            (ThreeObject as any).object[eid] = 0;
        });
    }
}
