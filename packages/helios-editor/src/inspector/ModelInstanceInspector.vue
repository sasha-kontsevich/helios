<template>
  <div class="model-instance-inspector">
    <label class="inspector__label" for="mi-model">model (GUID)</label>
    <input
      id="mi-model"
      class="inspector__input"
      type="text"
      :value="modelGuid"
      spellcheck="false"
      @change="onGuidChange"
    />
    <button type="button" class="inspector__btn" @click="emitExpand">Развернуть на сцене</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  componentName: "ModelInstance";
  fields: Record<string, unknown>;
  selectedEid?: number | null;
  rawMode: boolean;
}>();

const emit = defineEmits<{
  applyPatch: [payload: { componentName: string; patch: Record<string, unknown> }];
  expandModel: [];
}>();

const modelGuid = computed(() => String(props.fields.model ?? ""));

function onGuidChange(e: Event): void {
  const v = (e.target as HTMLInputElement).value;
  emit("applyPatch", { componentName: props.componentName, patch: { model: v } });
}

function emitExpand(): void {
  emit("expandModel");
}
</script>

<style scoped>
.model-instance-inspector {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
