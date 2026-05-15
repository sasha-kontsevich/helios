import type { Quat } from "@merlinn/helios-core";
import * as THREE from "three";
import { eulerDegreesFromRotationQuat, rotationQuatFromEulerDegrees } from "./rotationInspectorMath";

export interface EulerDegrees {
  x: number;
  y: number;
  z: number;
}

const hints = new Map<number, EulerDegrees>();
const tmpQuat = new THREE.Quaternion();
const tmpQuatCandidate = new THREE.Quaternion();

function cloneEuler(e: EulerDegrees): EulerDegrees {
  return { x: e.x, y: e.y, z: e.z };
}

function distanceSq(a: EulerDegrees, b: EulerDegrees): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

function equivalentBaseBranches(e: EulerDegrees): EulerDegrees[] {
  return [
    e,
    {
      x: e.x + 180,
      y: 180 - e.y,
      z: e.z + 180,
    },
  ];
}

function nearestByTurns(candidate: EulerDegrees, target: EulerDegrees): EulerDegrees {
  return {
    x: candidate.x + 360 * Math.round((target.x - candidate.x) / 360),
    y: candidate.y + 360 * Math.round((target.y - candidate.y) / 360),
    z: candidate.z + 360 * Math.round((target.z - candidate.z) / 360),
  };
}

function quatDotAbs(a: Quat, b: THREE.Quaternion): number {
  return Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w);
}

function isSameRotation(candidate: EulerDegrees, quat: Quat): boolean {
  const q = rotationQuatFromEulerDegrees(candidate.x, candidate.y, candidate.z);
  tmpQuatCandidate.set(q.x, q.y, q.z, q.w);
  return quatDotAbs(quat, tmpQuatCandidate) > 1 - 1e-5;
}

/**
 * Unity-like editor hint: keep the user's Euler branch stable even though runtime stores quaternion.
 */
export function getRotationEulerHint(eid: number | null, quat: Quat): EulerDegrees {
  const canonical = eulerDegreesFromRotationQuat(quat);
  if (eid === null) {
    return canonical;
  }

  const previous = hints.get(eid);
  if (!previous) {
    hints.set(eid, cloneEuler(canonical));
    return canonical;
  }

  tmpQuat.set(quat.x, quat.y, quat.z, quat.w);
  const candidates: EulerDegrees[] = [];
  for (const branch of equivalentBaseBranches(canonical)) {
    const nearest = nearestByTurns(branch, previous);
    candidates.push(nearest);
    candidates.push({ x: nearest.x + 360, y: nearest.y, z: nearest.z });
    candidates.push({ x: nearest.x - 360, y: nearest.y, z: nearest.z });
    candidates.push({ x: nearest.x, y: nearest.y + 360, z: nearest.z });
    candidates.push({ x: nearest.x, y: nearest.y - 360, z: nearest.z });
    candidates.push({ x: nearest.x, y: nearest.y, z: nearest.z + 360 });
    candidates.push({ x: nearest.x, y: nearest.y, z: nearest.z - 360 });
  }

  let best = canonical;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const candidate of candidates) {
    if (!isSameRotation(candidate, quat)) {
      continue;
    }
    const d = distanceSq(candidate, previous);
    if (d < bestDist) {
      best = candidate;
      bestDist = d;
    }
  }
  hints.set(eid, cloneEuler(best));
  return best;
}

export function setRotationEulerHint(eid: number | null, euler: EulerDegrees): void {
  if (eid === null) {
    return;
  }
  hints.set(eid, cloneEuler(euler));
}

export function setRotationEulerHintFromQuat(eid: number | null, quat: Quat): EulerDegrees {
  const e = getRotationEulerHint(eid, quat);
  setRotationEulerHint(eid, e);
  return e;
}
