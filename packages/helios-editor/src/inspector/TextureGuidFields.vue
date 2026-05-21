<template>
  <template v-if="slots.length > 0">
    <div class="texture-guids__title">Textures (GUID)</div>
    <template v-for="slot in slots" :key="slot">
      <label class="inspector__mini texture-guids__label">{{ slot }}</label>
      <input
        class="inspector__input ref-inspector__guid"
        type="text"
        spellcheck="false"
        autocomplete="off"
        :placeholder="'guid://textures/…'"
        :value="valueFor(slot)"
        @focus="emit('editingChanged', true)"
        @blur="emit('editingChanged', false)"
        @input="onInput(slot, $event)"
      />
    </template>
  </template>
</template>

<script setup lang="ts">
import type { MaterialTextureSlot } from "@merlinn/helios-core";

const props = defineProps<{
  slots: MaterialTextureSlot[];
  values: Record<string, unknown>;
}>();

const emit = defineEmits<{
  patch: [Partial<Record<MaterialTextureSlot, string>>];
  editingChanged: [boolean];
}>();

function valueFor(slot: MaterialTextureSlot): string {
  const v = props.values[slot];
  return typeof v === "string" ? v : "";
}

function onInput(slot: MaterialTextureSlot, event: Event): void {
  const input = event.target as HTMLInputElement;
  emit("patch", { [slot]: input.value });
}
</script>

<style scoped>
.texture-guids__title {
  grid-column: 1 / -1;
  margin-top: 6px;
  font-size: 10px;
  color: #888;
}
.texture-guids__label {
  align-self: center;
}
</style>
