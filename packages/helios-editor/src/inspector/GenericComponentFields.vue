<template>
  <div class="generic-fields">
    <div v-for="(value, fieldKey) in fields" :key="fieldKey" class="inspector__field">
      <label
        class="inspector__label"
        :class="{ 'inspector__label--draggable': isEditableField(String(fieldKey), value) }"
        @pointerdown="
          isEditableField(String(fieldKey), value) &&
            onLabelPointerDown(String(fieldKey), value, $event)
        "
      >
        {{ fieldKey }}
      </label>
      <input
        v-if="typeof value === 'string'"
        class="inspector__input"
        type="text"
        spellcheck="false"
        :value="getEditValue(String(fieldKey), value)"
        @focus="onFocus(String(fieldKey))"
        @blur="onBlur"
        @input="onStringFieldInput(String(fieldKey), $event)"
      />
      <input
        v-else-if="isEditableField(String(fieldKey), value)"
        class="inspector__input"
        type="number"
        step="any"
        :value="getEditValue(String(fieldKey), value)"
        @focus="onFocus(String(fieldKey))"
        @blur="onBlur"
        @input="onNumberFieldInput(String(fieldKey), $event)"
      />
      <div v-else class="inspector__readonly">
        {{ formatReadonlyValue(value) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { formatNumberForInput } from "./formatNumber";
import { isReadonlyResourceField } from "./readonlyResourceFields";
import { attachNumericScrub } from "./useNumericLabelScrub";

const props = defineProps<{
  componentName: string;
  fields: Record<string, unknown>;
  selectedEid: number | null;
}>();

const emit = defineEmits<{
  applyPatch: [payload: { componentName: string; patch: Record<string, unknown> }];
  editingChanged: [isEditing: boolean];
}>();

const edits = reactive<Record<string, string>>({});
const focusedKey = ref<string | null>(null);
let rafPending = false;
let lastPayload: { componentName: string; patch: Record<string, unknown> } | null = null;

const fields = computed(() => props.fields);

function keyOf(fieldKey: string): string {
  const eid = props.selectedEid;
  const prefix = eid === null ? "_none" : String(eid);
  return `${prefix}.${props.componentName}.${fieldKey}`;
}

function isEditableField(fieldKey: string, value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value) && !isReadonlyResourceField(fieldKey);
}

function getEditValue(fieldKey: string, fallback: unknown): string {
  const k = keyOf(fieldKey);
  if (k in edits) return edits[k];
  if (typeof fallback === "number" && Number.isFinite(fallback)) return formatNumberForInput(fallback);
  if (typeof fallback === "string") return fallback;
  return "";
}

function formatReadonlyValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return "[object]";
  return String(value);
}

function scheduleApplyAny(payload: { componentName: string; patch: Record<string, unknown> }) {
  lastPayload = payload;
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    rafPending = false;
    if (lastPayload) emit("applyPatch", lastPayload);
    lastPayload = null;
  });
}

function onFocus(fieldKey: string): void {
  focusedKey.value = keyOf(fieldKey);
  emit("editingChanged", true);
}

function onBlur(): void {
  focusedKey.value = null;
  emit("editingChanged", false);
}

function onNumberFieldInput(fieldKey: string, event: Event): void {
  const input = event.target as HTMLInputElement;
  const k = keyOf(fieldKey);
  edits[k] = input.value;
  const parsed = parseFloat(input.value);
  if (!Number.isFinite(parsed)) return;
  scheduleApplyAny({ componentName: props.componentName, patch: { [fieldKey]: parsed } });
}

function onStringFieldInput(fieldKey: string, event: Event): void {
  const input = event.target as HTMLInputElement;
  const k = keyOf(fieldKey);
  edits[k] = input.value;
  scheduleApplyAny({ componentName: props.componentName, patch: { [fieldKey]: input.value } });
}

function getNumericCurrent(fieldKey: string, fallback: unknown): number {
  const k = keyOf(fieldKey);
  const fromEdits = parseFloat(edits[k] ?? "");
  if (Number.isFinite(fromEdits)) return fromEdits;
  if (typeof fallback === "number" && Number.isFinite(fallback)) return fallback;
  return 0;
}

function onLabelPointerDown(fieldKey: string, fallback: unknown, event: PointerEvent): void {
  attachNumericScrub({
    event,
    getValue: () => getNumericCurrent(fieldKey, fallback),
    commit: (next) => {
      edits[keyOf(fieldKey)] = String(next);
      scheduleApplyAny({ componentName: props.componentName, patch: { [fieldKey]: next } });
    },
    onEditingStart: () => {
      focusedKey.value = keyOf(fieldKey);
      emit("editingChanged", true);
    },
    onEditingEnd: () => {
      focusedKey.value = null;
      emit("editingChanged", false);
    },
  });
}

watch(
  fields,
  (next) => {
    if (!next) return;
    for (const [fieldKey, value] of Object.entries(next)) {
      const k = keyOf(fieldKey);
      if (focusedKey.value === k) continue;
      if (typeof value === "number" && Number.isFinite(value)) {
        edits[k] = formatNumberForInput(value);
      } else if (typeof value === "string") {
        edits[k] = value;
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
.generic-fields {
  display: contents;
}
</style>
