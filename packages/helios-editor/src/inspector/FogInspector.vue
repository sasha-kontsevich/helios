<template>
  <div class="fog-inspector">
    <template v-if="rawMode">
      <GenericComponentFields
        component-name="Fog"
        :fields="fields"
        :selected-eid="selectedEid"
        @apply-patch="forwardPatch"
        @editing-changed="emit('editingChanged', $event)"
      />
    </template>
    <template v-else>
      <label class="inspector__mini">type</label>
      <select
        class="inspector__select inspector__select--inline"
        :value="fogType"
        @change="onTypeChange(($event.target as HTMLSelectElement).value)"
      >
        <option :value="FOG_TYPE_LINEAR">linear (near / far)</option>
        <option :value="FOG_TYPE_EXP2">exp2 (density)</option>
      </select>

      <label class="inspector__mini">color</label>
      <div class="inspector__color-row">
        <input
          class="inspector__color"
          type="color"
          :value="colorHex"
          @input="onColor(($event.target as HTMLInputElement).value)"
        />
        <input
          class="inspector__input"
          type="text"
          spellcheck="false"
          :value="colorHex"
          @input="onColor(($event.target as HTMLInputElement).value)"
        />
      </div>

      <template v-if="fogType === FOG_TYPE_LINEAR">
        <label class="inspector__mini inspector__mini--scrub" @pointerdown="scrub('near', $event)">near</label>
        <input
          class="inspector__input"
          type="number"
          step="any"
          :value="numVal('near')"
          @focus="emit('editingChanged', true)"
          @blur="emit('editingChanged', false)"
          @input="onNum('near', $event)"
        />
        <label class="inspector__mini inspector__mini--scrub" @pointerdown="scrub('far', $event)">far</label>
        <input
          class="inspector__input"
          type="number"
          step="any"
          :value="numVal('far')"
          @focus="emit('editingChanged', true)"
          @blur="emit('editingChanged', false)"
          @input="onNum('far', $event)"
        />
      </template>
      <template v-else>
        <label class="inspector__mini inspector__mini--scrub" @pointerdown="scrub('density', $event)">density</label>
        <input
          class="inspector__input"
          type="number"
          step="any"
          :value="numVal('density')"
          @focus="emit('editingChanged', true)"
          @blur="emit('editingChanged', false)"
          @input="onNum('density', $event)"
        />
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { FOG_TYPE_EXP2, FOG_TYPE_LINEAR, parseFogColor, parseFogType } from "@merlinn/helios-core";
import GenericComponentFields from "./GenericComponentFields.vue";
import { attachNumericScrub } from "./useNumericLabelScrub";

const props = defineProps<{
  fields: Record<string, unknown>;
  selectedEid: number | null;
  rawMode: boolean;
}>();

const emit = defineEmits<{
  applyPatch: [payload: { componentName: string; patch: Record<string, unknown> }];
  editingChanged: [isEditing: boolean];
}>();

const fogType = computed(() => parseFogType(props.fields.type ?? FOG_TYPE_LINEAR));

const colorHex = computed(() => {
  const n = parseFogColor(props.fields.color ?? 0xcccccc);
  return `#${n.toString(16).padStart(6, "0")}`;
});

function numVal(key: string): number {
  const v = props.fields[key];
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function forwardPatch(payload: { componentName: string; patch: Record<string, unknown> }) {
  emit("applyPatch", payload);
}

function patch(fields: Record<string, unknown>) {
  emit("applyPatch", { componentName: "Fog", patch: fields });
}

function onTypeChange(value: string) {
  patch({ type: Number(value) });
}

function onColor(hex: string) {
  patch({ color: parseFogColor(hex) });
}

function onNum(key: string, event: Event) {
  const raw = (event.target as HTMLInputElement).value;
  const n = Number(raw);
  if (!Number.isFinite(n)) return;
  patch({ [key]: n });
}

function scrub(key: string, event: PointerEvent) {
  attachNumericScrub({
    event,
    getValue: () => numVal(key),
    commit: (v: number) => patch({ [key]: v }),
    onEditingStart: () => emit("editingChanged", true),
    onEditingEnd: () => emit("editingChanged", false),
  });
}
</script>

<style scoped>
.fog-inspector {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 8px;
  align-items: center;
}
</style>
