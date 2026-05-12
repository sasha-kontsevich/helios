import * as THREE from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";

/**
 * Matches three.js `TransformControls` internal raycast helper (not exported from the module).
 */
function intersectObjectWithRay(
    object: THREE.Object3D,
    raycaster: THREE.Raycaster,
    includeInvisible: boolean,
): THREE.Intersection | false {
    const allIntersections = raycaster.intersectObject(object, true);
    for (let i = 0; i < allIntersections.length; i++) {
        if (allIntersections[i].object.visible || includeInvisible) {
            return allIntersections[i];
        }
    }
    return false;
}

/** Radial drag start shorter than this fraction of camera–pivot distance counts as “near center”. */
const UNIFORM_SCALE_REF_DIST_FACTOR = 0.028;
/** When shrinking near center, map |d| to |d|^exp so the same motion reduces scale more (exp > 1). */
const UNIFORM_SCALE_SHRINK_EXPONENT = 1.62;
/** When growing near center, slightly damp overshoot. */
const UNIFORM_SCALE_GROW_EXPONENT = 0.88;
const UNIFORM_D_MIN = 0.03;
const UNIFORM_D_MAX = 80;

const _camWorld = new THREE.Vector3();
const _uniformMul = new THREE.Vector3();

type TransformControlsInternals = TransformControls & {
    _plane: THREE.Object3D;
    pointStart: THREE.Vector3;
    pointEnd: THREE.Vector3;
    worldPositionStart: THREE.Vector3;
    _scaleStart: THREE.Vector3;
};

const _changeEvent = { type: "change" as const };
const _objectChangeEvent = { type: "objectChange" as const };

/**
 * {@link TransformControls} with a gentler **uniform scale** (center / XYZ) when the drag starts
 * close to the pivot: stock three.js uses |pointEnd|/|pointStart|, which barely moves when |pointStart| is tiny.
 */
export class HeliosTransformControls extends TransformControls {
    override pointerMove(pointer: Parameters<TransformControls["pointerMove"]>[0]): void {
        const self = this as unknown as TransformControlsInternals;
        const axis = self.axis;
        const mode = self.mode;
        const object = self.object;

        if (
            object === undefined ||
            axis === null ||
            self.dragging === false ||
            (pointer !== null && (pointer as { button?: number }).button !== -1)
        ) {
            return;
        }

        if (mode !== "scale" || axis.search("XYZ") === -1) {
            super.pointerMove(pointer);
            return;
        }

        if (pointer !== null) {
            self.getRaycaster().setFromCamera(pointer as unknown as THREE.Vector2, self.camera);
        }

        const planeIntersect = intersectObjectWithRay(self._plane, self.getRaycaster(), true);
        if (!planeIntersect) {
            return;
        }

        self.pointEnd.copy(planeIntersect.point).sub(self.worldPositionStart);

        const lenS = Math.max(self.pointStart.length(), 1e-12);
        const lenE = self.pointEnd.length();
        let d = lenE / lenS;
        if (self.pointEnd.dot(self.pointStart) < 0) {
            d *= -1;
        }

        _camWorld.setFromMatrixPosition(self.camera.matrixWorld);
        const pivotDist = _camWorld.distanceTo(self.worldPositionStart);
        const refRadius = Math.max(pivotDist * UNIFORM_SCALE_REF_DIST_FACTOR, 1e-4);
        const shortStart = lenS < refRadius;

        if (shortStart) {
            const sign = d < 0 ? -1 : 1;
            const ad = Math.abs(d);
            if (ad < 1 && ad > 0) {
                d = sign * Math.pow(ad, UNIFORM_SCALE_SHRINK_EXPONENT);
            } else if (ad > 1) {
                d = sign * Math.pow(ad, UNIFORM_SCALE_GROW_EXPONENT);
            }
        }

        d = THREE.MathUtils.clamp(d, UNIFORM_D_MIN, UNIFORM_D_MAX);
        _uniformMul.set(d, d, d);
        object.scale.copy(self._scaleStart).multiply(_uniformMul);

        const snap = self.scaleSnap;
        if (snap !== null) {
            if (axis.search("X") !== -1) {
                object.scale.x = Math.round(object.scale.x / snap) * snap || snap;
            }
            if (axis.search("Y") !== -1) {
                object.scale.y = Math.round(object.scale.y / snap) * snap || snap;
            }
            if (axis.search("Z") !== -1) {
                object.scale.z = Math.round(object.scale.z / snap) * snap || snap;
            }
        }

        self.dispatchEvent(_changeEvent);
        self.dispatchEvent(_objectChangeEvent);
    }
}
