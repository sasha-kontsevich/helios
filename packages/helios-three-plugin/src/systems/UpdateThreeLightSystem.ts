import { addComponent, addEntity, defineQuery, enterQuery, exitQuery } from 'bitecs';
import { System } from '@merlinn/helios-core';
import * as THREE from 'three';
import { ThreeLight, ThreeObject } from '../components';

/**
 * Bootstrap lights for scenes that don't define any.
 *
 * Creates:
 * - AmbientLight for base visibility
 * - DirectionalLight for shading
 *
 * If any `ThreeLight` exists (e.g. loaded from a scene), bootstrap is skipped.
 */
export class UpdateThreeLightSystem extends System {
    private readonly lightQuery = defineQuery([ThreeLight, ThreeObject]);
    private readonly lightEnter = enterQuery(this.lightQuery);
    private readonly lightExit = exitQuery(this.lightQuery);
    private readonly anyLightQuery = defineQuery([ThreeLight]);

    async start(): Promise<void> {
        if (this.anyLightQuery(this.world).length > 0) {
            return;
        }

        // Ambient
        {
            const eid = addEntity(this.world);
            addComponent(this.world, ThreeLight, eid);
            addComponent(this.world, ThreeObject, eid);
            // Keep ambient low enough so directional shading is visible.
            ThreeLight.intensity[eid] = 0.25;
            ThreeObject.get(eid).object = new THREE.AmbientLight(0xffffff, ThreeLight.intensity[eid]);
        }

        // Directional
        {
            const lightEid = addEntity(this.world);
            addComponent(this.world, ThreeLight, lightEid);
            addComponent(this.world, ThreeObject, lightEid);
            ThreeLight.intensity[lightEid] = 1.2;
            const light = new THREE.DirectionalLight(0xffffff, ThreeLight.intensity[lightEid]);
            light.position.set(3, 5, 2);

            // Three.js expects the target to be part of the scene graph.
            // Create a separate ECS entity for `light.target` so `ThreeSceneSystem` adds it.
            const targetEid = addEntity(this.world);
            addComponent(this.world, ThreeObject, targetEid);
            light.target.position.set(0, 0, 0);
            ThreeObject.get(targetEid).object = light.target;

            ThreeObject.get(lightEid).object = light;
        }
    }

    update(): void {
        const world = this.world;

        // Create missing objects for newly added lights (e.g. scene-loaded entities).
        this.lightEnter(world).forEach((eid) => {
            const obj = ThreeObject.get(eid).object;
            if (obj) return;
            ThreeObject.get(eid).object = new THREE.AmbientLight(0xffffff, ThreeLight.intensity[eid] || 1);
        });

        // Keep intensity in sync.
        this.lightQuery(world).forEach((eid) => {
            const obj = ThreeObject.get(eid).object as THREE.Object3D | undefined;
            if (!obj) return;
            if (obj instanceof THREE.Light) {
                obj.intensity = ThreeLight.intensity[eid];
            }
        });

        // Cleanup scene graph on exit.
        this.lightExit(world).forEach((eid) => {
            const obj = ThreeObject.get(eid).object as THREE.Object3D | undefined;
            if (!obj) return;
            obj.parent?.remove(obj);
            (ThreeObject as any).object[eid] = 0;
        });
    }
}

