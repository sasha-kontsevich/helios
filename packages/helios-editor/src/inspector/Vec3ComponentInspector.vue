<template>
  <div class="vec3-inspector">
    <template v-if="rawMode">
      <GenericComponentFields
        :component-name="componentName"
        :fields="vecFieldsOnly"
        :selected-eid="selectedEid"
        @apply-patch="forwardPatch"
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
        <button
          v-if="showUniformLock"
          type="button"
          class="inspector__lockBtn"
          :class="{ 'inspector__lockBtn--active': uniformLocked }"
          title="Равномерный масштаб"
          aria-label="Равномерный масштаб"
          @click="uniformLocked = !uniformLocked"
        >
          <svg class="inspector__lockIcon" viewBox="0 0 16 16" aria-hidden="true">
            <path
              v-if="uniformLocked"
              fill="currentColor"
              d="M12 7h-1V5a4 4 0 10-8 0v2H2a1 1 0 00-1 1v6a1 1 0 001 1h10a1 1 0 001-1V8a1 1 0 00-1-1zM5 5a3 3 0 016 0v2H5V5z"
            />
            <path
              v-else
              fill="currentColor"
              d="M12 7h-1V5a4 4 0 00-7.3-2.2.8.8 0 011.2.9A2.5 2.5 0 0111 5v2H5V5a1 1 0 00-2 0v2H2a1 1 0 00-1 1v6a1 1 0 001 1h10a1 1 0 001-1V8a1 1 0 00-1-1zm0 7H4V9h8v5z"
            />
          </svg>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import GenericComponentFields from "./GenericComponentFields.vue";
import { formatNumberForInput } from "./formatNumber";
import { attachNumericScrub } from "./useNumericLabelScrub";

const props = defineProps<{
  componentName: string;
  fields: Record<string, unknown>;
  selectedEid: number | null;
  rawMode: boolean;
  /** When true (Scale), show uniform scale lock in friendly mode. */
  showUniformLock?: boolean;
}>();

const emit = defineEmits<{
  applyPatch: [payload: { componentName: string; patch: Record<string, unknown> }];
  editingChanged: [isEditing: boolean];
}>();

const uniformLocked = ref(false);
const edits = reactive<Record<string, string>>({});
const focusedKey = ref<string | null>(null);
let rafPending = false;
let lastPayload: { componentName: string; patch: Record<string, unknown> } | null = null;

const axes = ["x", "y", "z"] as const;

const vecFieldsOnly = computed(() => {
  const f = props.fields;
  const out: Record<string, unknown> = {};
  for (const a of axes) {
    const v = f[a];
    out[a] = typeof v === "number" && Number.isFinite(v) ? v : 0;
  }
  return out;
});

function keyOf(axis: string): string {
  const eid = props.selectedEid;
  const prefix = eid === null ? "_none" : String(eid);
  return `${prefix}.${props.componentName}.${axis}`;
}

function num(axis: string): number {
  const v = props.fields[axis];
  const base = typeof v === "number" && Number.isFinite(v) ? v : 0;
  const k = keyOf(axis);
  const parsed = parseFloat(edits[k] ?? "");
  if (Number.isFinite(parsed)) return parsed;
  return base;
}

function displayVal(axis: string): string {
  const k = keyOf(axis);
  if (k in edits) return edits[k];
  return formatNumberForInput(num(axis));
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

function forwardPatch(p: { componentName: string; patch: Record<string, unknown> }) {
  emit("applyPatch", p);
}

function onChildEditingChanged(v: boolean) {
  emit("editingChanged", v);
}

function onFocus(axis: string): void {
  focusedKey.value = keyOf(axis);
  emit("editingChanged", true);
}

function onBlur(): void {
  focusedKey.value = null;
  emit("editingChanged", false);
}

function onAxisInput(axis: "x" | "y" | "z", event: Event): void {
  const input = event.target as HTMLInputElement;
  const k = keyOf(axis);
  edits[k] = input.value;
  const parsed = parseFloat(input.value);
  if (!Number.isFinite(parsed)) return;
  if (props.showUniformLock && uniformLocked.value) {
    scheduleApply({ x: parsed, y: parsed, z: parsed });
    for (const a of axes) {
      edits[keyOf(a)] = String(parsed);
    }
    return;
  }
  scheduleApply({ [axis]: parsed });
}

function applyDragValue(axis: "x" | "y" | "z", next: number): void {
  if (props.showUniformLock && uniformLocked.value) {
    for (const a of axes) {
      edits[keyOf(a)] = String(next);
    }
    scheduleApply({ x: next, y: next, z: next });
    return;
  }
  edits[keyOf(axis)] = String(next);
  scheduleApply({ [axis]: next });
}

function onLabelPointerDown(axis: "x" | "y" | "z", event: PointerEvent): void {
  attachNumericScrub({
    event,
    getValue: () => num(axis),
    commit: (next) => applyDragValue(axis, next),
    onEditingStart: () => {
      focusedKey.value = keyOf(axis);
      emit("editingChanged", true);
    },
    onEditingEnd: () => {
      focusedKey.value = null;
      emit("editingChanged", false);
    },
  });
}

watch(
  () => props.fields,
  (next) => {
    if (!next) return;
    for (const a of axes) {
      const k = keyOf(a);
      if (focusedKey.value === k) continue;
      const v = next[a];
      if (typeof v === "number" && Number.isFinite(v)) {
        edits[k] = formatNumberForInput(v);
      }
    }
  },
  { immediate: true, deep: true },
);

watch(
  () => props.selectedEid,
  () => {
    focusedKey.value = null;
  },
);
</script>

<style scoped>
.vec3-inspector {
  width: 100%;
}
.inspector__vec3Row {
  display: grid;
  grid-template-columns: 14px 1fr 14px 1fr 14px 1fr auto;
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
.inspector__lockBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 22px;
  padding: 0;
  margin-left: 2px;
  color: #777;
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 2px;
  cursor: pointer;
}
.inspector__lockBtn:hover {
  color: #bbb;
  border-color: #666;
}
.inspector__lockBtn--active {
  color: #9cf;
  border-color: #6af;
}
.inspector__lockIcon {
  width: 14px;
  height: 14px;
}
</style>
