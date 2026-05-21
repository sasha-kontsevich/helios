<template>
  <div class="model-assets">
    <p class="model-assets__hint">
      .glb / .obj — во вьюпорт (FBX — CLI). Текстуры — секция ниже.
    </p>
    <ul v-if="guids.length" class="model-assets__list">
      <li v-for="guid in guids" :key="guid" class="model-assets__item">
        <span class="model-assets__guid">{{ shortGuid(guid) }}</span>
        <button type="button" class="model-assets__btn" @click="emit('spawn', guid)">На сцену</button>
      </li>
    </ul>
    <p v-else class="model-assets__empty">Нет model-ассетов в asset-index.</p>
    <p v-if="toast" class="model-assets__toast">{{ toast }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { EngineAPI } from "@merlinn/helios-core";

const props = defineProps<{
  engineApi: EngineAPI;
  /** True when the Assets tab is visible — refresh after engine.indexMeta. */
  tabActive?: boolean;
}>();

const emit = defineEmits<{
  spawn: [guid: string];
}>();

const guids = ref<string[]>([]);
const toast = ref("");

function shortGuid(guid: string): string {
  const parts = guid.split("/");
  return parts[parts.length - 1] || guid;
}

function refresh(): void {
  guids.value = props.engineApi.listModelAssetGuids();
}

watch(
  () => props.tabActive,
  (active) => {
    if (active) refresh();
  },
  { immediate: true },
);

defineExpose({ refresh, showToast: (msg: string) => { toast.value = msg; } });
</script>

<style scoped>
.model-assets {
  padding: 8px 10px;
  font-size: 12px;
}
.model-assets__hint {
  margin: 0 0 8px;
  color: var(--helios-muted, #888);
}
.model-assets__list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.model-assets__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 0;
}
.model-assets__guid {
  overflow: hidden;
  text-overflow: ellipsis;
}
.model-assets__btn {
  flex-shrink: 0;
  font-size: 11px;
}
.model-assets__empty,
.model-assets__toast {
  margin: 8px 0 0;
  color: var(--helios-muted, #888);
}
</style>
