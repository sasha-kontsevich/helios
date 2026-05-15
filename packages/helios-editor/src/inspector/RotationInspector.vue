<template>
  <div class="rotation-inspector">
    <template v-if="rawMode">
      <GenericComponentFields
        :component-name="componentName"
        :fields="quatFields"
        :selected-eid="selectedEid"
        @apply-patch="onRawPatch"
        @editing-changed="onChildEditingChanged"
      />
    </template>
    <template v-else>
      <div class="inspector__vec3Row">
        <span
          class="inspector__vec3Axis"
          @pointerdown="onLabelPointerDown('x', $event)"
        >X</span>
        <input
          class="inspector__input inspector__input--vec3"
          type="number"
          step="any"
          :value="displayVal('x')"
          @focus="onFocus('x')"
          @blur="onBlur"
          @input="onAxisInput('x', $event)"
        />
        <span
          class="inspector__vec3Axis"
          @pointerdown="onLabelPointerDown('y', $event)"
        >Y</span>
        <input
          class="inspector__input inspector__input--vec3"
          type="number"
          step="any"
          :value="displayVal('y')"
          @focus="onFocus('y')"
          @blur="onBlur"
          @input="onAxisInput('y', $event)"
        />
        <span
          class="inspector__vec3Axis"
          @pointerdown="onLabelPointerDown('z', $event)"
        >Z</span>
        <input
          class="inspector__input inspector__input--vec3"
          type="number"
          step="any"
          :value="displayVal('z')"
          @focus="onFocus('z')"
          @blur="onBlur"
          @input="onAxisInput('z', $event)"
        />
      </div>
      <p class="rotation-inspector__hint">Euler XYZ (°) · stored as quaternion</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import GenericComponentFields from "./GenericComponentFields.vue";
import {
  rotationQuatFromEulerDegrees,
} from "./rotationInspectorMath";
import { getRotationEulerHint, setRotationEulerHint } from "./rotationEulerHintStore";
import { formatNumberForInput } from "./formatNumber";
import { attachNumericScrub } from "./useNumericLabelScrub";

const props = defineProps<{
  componentName: string;
  fields: Record<string, unknown>;
  selectedEid: number | null;
  rawMode: boolean;
}>();

const emit = defineEmits<{
  applyPatch: [payload: { componentName: string; patch: Record<string, unknown> }];
  editingChanged: [isEditing: boolean];
}>();

const axes = ["x", "y", "z"] as const;

/** Inspector euler (degrees) — source of truth while editing; not re-derived from quat each keystroke. */
const localEulerDeg = reactive({ x: 0, y: 0, z: 0 });

const edits = reactive<Record<string, string>>({});
const focusedKey = ref<string | null>(null);
const editingCount = ref(0);

let rafPending = false;
let lastPayload: { componentName: string; patch: Record<string, unknown> } | null = null;

function readQuat() {
  const f = props.fields;
  return {
    x: typeof f.x === "number" && Number.isFinite(f.x) ? f.x : 0,
    y: typeof f.y === "number" && Number.isFinite(f.y) ? f.y : 0,
    z: typeof f.z === "number" && Number.isFinite(f.z) ? f.z : 0,
    w: typeof f.w === "number" && Number.isFinite(f.w) ? f.w : 1,
  };
}

function syncLocalEulerFromQuat(): void {
  const e = getRotationEulerHint(props.selectedEid, readQuat());
  localEulerDeg.x = e.x;
  localEulerDeg.y = e.y;
  localEulerDeg.z = e.z;
  refreshEditsFromLocal();
}

function refreshEditsFromLocal(): void {
  for (const a of axes) {
    const k = keyOf(a);
    if (focusedKey.value === k) continue;
    edits[k] = formatNumberForInput(localEulerDeg[a]);
  }
}

const quatFields = computed(() => readQuat());

function keyOf(axis: string): string {
  const eid = props.selectedEid;
  const prefix = eid === null ? "_none" : String(eid);
  return `${prefix}.${props.componentName}.euler.${axis}`;
}

function num(axis: "x" | "y" | "z"): number {
  const k = keyOf(axis);
  const parsed = parseFloat(edits[k] ?? "");
  if (Number.isFinite(parsed)) return parsed;
  return localEulerDeg[axis];
}

function displayVal(axis: "x" | "y" | "z"): string {
  const k = keyOf(axis);
  if (k in edits) return edits[k];
  return formatNumberForInput(localEulerDeg[axis]);
}

function scheduleApply(patch: Record<string, unknown>) {
  lastPayload = { componentName: props.componentName, patch };
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    rafPending = false;
    if (lastPayload) emit("applyPatch", lastPayload);
    lastPayload = null;
  });
}

function pushLocalEulerToQuat(): void {
  setRotationEulerHint(props.selectedEid, localEulerDeg);
  const q = rotationQuatFromEulerDegrees(localEulerDeg.x, localEulerDeg.y, localEulerDeg.z);
  scheduleApply({ x: q.x, y: q.y, z: q.z, w: q.w });
}

function onRawPatch(p: { componentName: string; patch: Record<string, unknown> }) {
  emit("applyPatch", p);
}

function onChildEditingChanged(v: boolean) {
  emit("editingChanged", v);
}

function beginEdit(): void {
  if (editingCount.value === 0) {
    emit("editingChanged", true);
  }
  editingCount.value++;
}

function endEdit(): void {
  editingCount.value = Math.max(0, editingCount.value - 1);
  if (editingCount.value === 0) {
    emit("editingChanged", false);
    syncLocalEulerFromQuat();
  }
}

function onFocus(axis: string): void {
  focusedKey.value = keyOf(axis);
  beginEdit();
}

function onBlur(): void {
  focusedKey.value = null;
  endEdit();
}

function onAxisInput(axis: "x" | "y" | "z", event: Event): void {
  const input = event.target as HTMLInputElement;
  const k = keyOf(axis);
  edits[k] = input.value;
  const parsed = parseFloat(input.value);
  if (!Number.isFinite(parsed)) return;
  localEulerDeg[axis] = parsed;
  pushLocalEulerToQuat();
}

function applyDragValue(axis: "x" | "y" | "z", next: number): void {
  localEulerDeg[axis] = next;
  edits[keyOf(axis)] = String(next);
  pushLocalEulerToQuat();
}

function onLabelPointerDown(axis: "x" | "y" | "z", event: PointerEvent): void {
  attachNumericScrub({
    event,
    getValue: () => num(axis),
    commit: (next) => applyDragValue(axis, next),
    onEditingStart: () => {
      focusedKey.value = keyOf(axis);
      beginEdit();
    },
    onEditingEnd: () => {
      focusedKey.value = null;
      endEdit();
    },
  });
}

watch(
  () => props.selectedEid,
  () => {
    focusedKey.value = null;
    editingCount.value = 0;
    syncLocalEulerFromQuat();
  },
  { immediate: true },
);

watch(
  () => [props.fields.x, props.fields.y, props.fields.z, props.fields.w] as const,
  () => {
    if (editingCount.value > 0) {
      return;
    }
    syncLocalEulerFromQuat();
  },
);
</script>

<style scoped>
.rotation-inspector {
  width: 100%;
}
.inspector__vec3Row {
  display: grid;
  grid-template-columns: 14px 1fr 14px 1fr 14px 1fr;
  gap: 4px 6px;
  align-items: center;
  font-size: 11px;
  margin-bottom: 4px;
}
.inspector__vec3Axis {
  color: #888;
  text-align: center;
  user-select: none;
  cursor: ew-resize;
}
.inspector__input--vec3 {
  width: 100%;
  box-sizing: border-box;
  padding: 4px 4px;
  font-size: 11px;
  font-family: ui-monospace, monospace;
  color: #eee;
  background: #111;
  border: 1px solid #444;
  border-radius: 2px;
}
.inspector__input--vec3:focus {
  outline: none;
  border-color: #6af;
}
.rotation-inspector__hint {
  margin: 0 0 4px;
  font-size: 10px;
  color: #666;
}
</style>
