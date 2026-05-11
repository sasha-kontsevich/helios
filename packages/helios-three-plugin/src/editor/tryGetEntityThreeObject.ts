import { entityExists, hasComponent } from 'bitecs';
import type { IWorld } from 'bitecs';
import * as THREE from 'three';
import { ThreeObject } from '../components';

/**
 * Returns the live `THREE.Object3D` attached to an entity via {@link ThreeObject}, if any.
 * Used by editor overlays (selection, gizmos) without duplicating bitecs queries in the editor package.
 */
export function tryGetEntityThreeObject(world: IWorld, eid: number): THREE.Object3D | undefined {
    if (!entityExists(world as any, eid)) {
        return undefined;
    }
    if (!hasComponent(world, ThreeObject as any, eid)) {
        return undefined;
    }
    const obj = ThreeObject.get(eid).object as THREE.Object3D | undefined;
    return obj ?? undefined;
}
