<template>
  <div class="texture-assets">
    <p class="texture-assets__hint">
      Drag .png / .jpg / .webp into the viewport. Select an entity with Material — Apply to map.
    </p>
    <ul v-if="guids.length" class="texture-assets__list">
      <li v-for="guid in guids" :key="guid" class="texture-assets__item">
        <span class="texture-assets__guid" :title="guid">{{ shortGuid(guid) }}</span>
        <div class="texture-assets__actions">
          <button type="button" class="texture-assets__btn" @click="emit('copyGuid', guid)">GUID</button>
          <button
            type="button"
            class="texture-assets__btn"
            :disabled="!canApply"
            title="Apply as map to the selected entity's Material.descriptor"
            @click="emit('applyMap', guid)"
          >
            To map
          </button>
        </div>
      </li>
    </ul>
    <p v-else class="texture-assets__empty">No texture assets in asset-index.</p>
    <p v-if="toast" class="texture-assets__toast">{{ toast }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { EngineAPI } from "@merlinn/helios-core";

const props = defineProps<{
  engineApi: EngineAPI;
  tabActive?: boolean;
  canApply?: boolean;
}>();

const emit = defineEmits<{
  copyGuid: [guid: string];
  applyMap: [guid: string];
}>();

const guids = ref<string[]>([]);
const toast = ref("");

function shortGuid(guid: string): string {
  const parts = guid.split("/");
  return parts[parts.length - 1] || guid;
}

function refresh(): void {
  guids.value = props.engineApi.listTextureAssetGuids();
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
.texture-assets {
  padding: 8px 10px 0;
  font-size: 12px;
}
.texture-assets__hint {
  margin: 0 0 8px;
  color: var(--helios-muted, #888);
  line-height: 1.35;
}
.texture-assets__list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.texture-assets__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 0;
}
.texture-assets__guid {
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}
.texture-assets__actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.texture-assets__btn {
  font-size: 11px;
}
.texture-assets__btn:disabled {
  opacity: 0.45;
}
.texture-assets__empty,
.texture-assets__toast {
  margin: 8px 0 0;
  color: var(--helios-muted, #888);
}
</style>
