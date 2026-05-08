<template>
  <div class="inspector">
    <div class="inspector__header">
      <span>Components</span>
      <div class="inspector__header-actions" v-if="selectedEid !== null">
        <select class="inspector__select" v-model="addSelected">
          <option value="" disabled>Add component…</option>
          <option v-if="availableComponents.length === 0" value="" disabled>
            No components registered
          </option>
          <option v-for="name in availableComponents" :key="name" :value="name">
            {{ name }}
          </option>
        </select>
        <button class="inspector__btn" :disabled="!addSelected" @click="onAddComponent">
          Add
        </button>
      </div>
    </div>
    <div v-if="selectedEid === null" class="inspector__empty">Select an entity</div>
    <div v-else-if="snapshot" class="inspector__body">
      <section
        v-for="(fields, compName) in snapshot.components"
        :key="compName"
        class="inspector__component"
      >
        <div class="inspector__comp-row">
          <h3 class="inspector__comp-title">{{ compName }}</h3>
          <button
            class="inspector__icon-btn"
            type="button"
            :aria-label="`Remove component ${String(compName)}`"
            title="Remove component"
            @click="onRemoveComponent(String(compName))"
          >
            ×
          </button>
        </div>
        <div
          v-for="(value, fieldKey) in fields"
          :key="fieldKey"
          class="inspector__field"
        >
          <label
            class="inspector__label"
            :class="{ 'inspector__label--draggable': isEditableField(String(fieldKey), value) }"
            @pointerdown="
              isEditableField(String(fieldKey), value) &&
                onLabelPointerDown(String(compName), String(fieldKey), value, $event)
            "
          >
            {{ fieldKey }}
          </label>
          <input
            v-if="isEditableField(fieldKey, value)"
            class="inspector__input"
            type="number"
            step="any"
            :value="getEditValue(String(compName), String(fieldKey), value)"
            @focus="onFocus(String(compName), String(fieldKey))"
            @blur="onBlur"
            @input="onFieldInput(String(compName), String(fieldKey), $event)"
          />
          <div v-else class="inspector__readonly">
            {{ formatReadonlyValue(value) }}
          </div>
        </div>
      </section>
    </div>
    <div v-else class="inspector__empty">No snapshot</div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type { EntitySnapshot } from "@merlinn/helios-core";
import { isReadonlyResourceField } from "./readonlyResourceFields";

const props = defineProps<{
  selectedEid: number | null;
  snapshot: EntitySnapshot | null;
  availableComponents?: string[];
}>();

const emit = defineEmits<{
  applyPatch: [payload: { componentName: string; patch: Record<string, number> }];
  editingChanged: [isEditing: boolean];
  addComponent: [componentName: string];
  removeComponent: [componentName: string];
}>();

const edits = reactive<Record<string, string>>({});
const focusedKey = ref<string | null>(null);
let rafPending = false;
let lastPayload: { componentName: string; patch: Record<string, number> } | null = null;

const drag = reactive({
  active: false,
  pointerId: 0,
  componentName: "",
  fieldKey: "",
  startClientX: 0,
  lastClientX: 0,
  lastTime: 0,
  startValue: 0,
  lastAppliedValue: 0,
});

const addSelected = ref<string>("");
const availableComponents = computed(() => props.availableComponents ?? []);

function onAddComponent(): void {
  if (!addSelected.value) return;
  emit("addComponent", addSelected.value);
  addSelected.value = "";
}

function onRemoveComponent(componentName: string): void {
  emit("removeComponent", componentName);
}

function isEditableField(fieldKey: string, value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value) && !isReadonlyResourceField(fieldKey);
}

function keyOf(componentName: string, fieldKey: string): string {
  return `${componentName}.${fieldKey}`;
}

function getEditValue(componentName: string, fieldKey: string, fallback: unknown): string {
  const k = keyOf(componentName, fieldKey);
  if (k in edits) return edits[k];
  if (typeof fallback === "number" && Number.isFinite(fallback)) return String(fallback);
  return "";
}

function formatReadonlyValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return "[object]";
  return String(value);
}

function scheduleApply(payload: { componentName: string; patch: Record<string, number> }) {
  lastPayload = payload;
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    rafPending = false;
    if (lastPayload) emit("applyPatch", lastPayload);
    lastPayload = null;
  });
}

function onFocus(componentName: string, fieldKey: string): void {
  focusedKey.value = keyOf(componentName, fieldKey);
  emit("editingChanged", true);
}

function onBlur(): void {
  focusedKey.value = null;
  emit("editingChanged", false);
}

function onFieldInput(componentName: string, fieldKey: string, event: Event): void {
  const input = event.target as HTMLInputElement;
  const k = keyOf(componentName, fieldKey);
  edits[k] = input.value;

  const parsed = parseFloat(input.value);
  if (!Number.isFinite(parsed)) return;
  scheduleApply({ componentName, patch: { [fieldKey]: parsed } });
}

function clampFinite(n: number, fallback: number): number {
  return Number.isFinite(n) ? n : fallback;
}

function getNumericCurrent(componentName: string, fieldKey: string, fallback: unknown): number {
  const k = keyOf(componentName, fieldKey);
  const fromEdits = parseFloat(edits[k] ?? "");
  if (Number.isFinite(fromEdits)) return fromEdits;
  if (typeof fallback === "number" && Number.isFinite(fallback)) return fallback;
  return 0;
}

function getDragStep(event: PointerEvent): number {
  // Base sensitivity. Actual step is made adaptive in onWindowPointerMove.
  const base = 0.02;
  if (event.shiftKey) return base * 0.2;
  if (event.altKey) return base * 8;
  return base;
}

function onLabelPointerDown(
  componentName: string,
  fieldKey: string,
  fallback: unknown,
  event: PointerEvent,
): void {
  if (event.button !== 0) return;
  event.preventDefault();

  drag.active = true;
  drag.pointerId = event.pointerId;
  drag.componentName = componentName;
  drag.fieldKey = fieldKey;
  drag.startClientX = event.clientX;
  drag.lastClientX = event.clientX;
  drag.lastTime = event.timeStamp || performance.now();
  drag.startValue = getNumericCurrent(componentName, fieldKey, fallback);
  drag.lastAppliedValue = drag.startValue;

  focusedKey.value = keyOf(componentName, fieldKey);
  emit("editingChanged", true);

  (event.currentTarget as HTMLElement | null)?.setPointerCapture?.(event.pointerId);
  window.addEventListener("pointermove", onWindowPointerMove, { passive: false });
  window.addEventListener("pointerup", onWindowPointerUp, { passive: false });
  window.addEventListener("pointercancel", onWindowPointerUp, { passive: false });
}

function onWindowPointerMove(event: PointerEvent): void {
  if (!drag.active || event.pointerId !== drag.pointerId) return;
  event.preventDefault();

  const now = event.timeStamp || performance.now();
  const dtMs = Math.max(1, now - drag.lastTime);
  const dxStep = event.clientX - drag.lastClientX; // incremental movement
  drag.lastClientX = event.clientX;
  drag.lastTime = now;

  const baseStep = getDragStep(event);
  // Magnitude scaling: bigger numbers change faster, small numbers remain precise.
  const mag = Math.max(1, Math.abs(drag.lastAppliedValue));
  const magnitudeFactor = 0.02 * mag + 1; // 1 .. grows linearly

  // Speed scaling: faster pointer movement accelerates.
  const pxPerMs = Math.abs(dxStep) / dtMs;
  const speedFactor = Math.min(12, Math.max(0.25, pxPerMs * 6)); // ~0.25..12

  const delta = dxStep * baseStep * magnitudeFactor * speedFactor;
  const next = clampFinite(drag.lastAppliedValue + delta, drag.lastAppliedValue);

  // Keep local input state in sync while dragging.
  edits[keyOf(drag.componentName, drag.fieldKey)] = String(next);

  if (next !== drag.lastAppliedValue) {
    drag.lastAppliedValue = next;
    scheduleApply({ componentName: drag.componentName, patch: { [drag.fieldKey]: next } });
  }
}

function onWindowPointerUp(event: PointerEvent): void {
  if (!drag.active || event.pointerId !== drag.pointerId) return;
  event.preventDefault();

  drag.active = false;
  drag.pointerId = 0;
  drag.componentName = "";
  drag.fieldKey = "";

  focusedKey.value = null;
  emit("editingChanged", false);

  window.removeEventListener("pointermove", onWindowPointerMove as any);
  window.removeEventListener("pointerup", onWindowPointerUp as any);
  window.removeEventListener("pointercancel", onWindowPointerUp as any);
}

watch(
  () => props.snapshot,
  (next) => {
    // Sync non-focused fields from snapshot, but do not overwrite the one being edited.
    if (!next) return;
    for (const [compName, fields] of Object.entries(next.components)) {
      for (const [fieldKey, value] of Object.entries(fields)) {
        const k = keyOf(compName, fieldKey);
        if (focusedKey.value === k) continue;
        if (typeof value === "number" && Number.isFinite(value)) {
          edits[k] = String(value);
        }
      }
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.inspector {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.inspector__header {
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #bbb;
  border-bottom: 1px solid #333;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.inspector__header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.inspector__select {
  height: 22px;
  font-size: 11px;
  color: #eee;
  background: #111;
  border: 1px solid #444;
  border-radius: 2px;
  padding: 0 6px;
}
.inspector__empty {
  padding: 12px 10px;
  font-size: 12px;
  color: #777;
}
.inspector__body {
  overflow: auto;
  flex: 1;
  padding: 8px 10px 12px;
}
.inspector__component {
  margin-bottom: 14px;
}
.inspector__comp-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 0 0 8px;
}
.inspector__comp-title {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  color: #9cf;
  text-transform: none;
}
.inspector__btn {
  height: 22px;
  padding: 0 8px;
  font-size: 11px;
  color: #eee;
  background: #1b1b1b;
  border: 1px solid #444;
  border-radius: 2px;
  cursor: pointer;
}
.inspector__btn:disabled {
  opacity: 0.5;
  cursor: default;
}
.inspector__icon-btn {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  line-height: 1;
  color: #ddd;
  background: transparent;
  border: 1px solid #444;
  border-radius: 2px;
  cursor: pointer;
}
.inspector__icon-btn:hover {
  background: #2a1515;
  border-color: #5a2a2a;
  color: #fff;
}
.inspector__field {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 6px;
  align-items: center;
  margin-bottom: 6px;
  font-size: 11px;
}
.inspector__label {
  color: #888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  user-select: none;
}
.inspector__label--draggable {
  cursor: ew-resize;
}
.inspector__input {
  width: 100%;
  box-sizing: border-box;
  padding: 4px 6px;
  font-size: 11px;
  font-family: ui-monospace, monospace;
  color: #eee;
  background: #111;
  border: 1px solid #444;
  border-radius: 2px;
}
.inspector__input:focus {
  outline: none;
  border-color: #6af;
}
.inspector__readonly {
  padding: 4px 2px;
  color: #aaa;
  font-family: ui-monospace, monospace;
  word-break: break-word;
}
</style>
