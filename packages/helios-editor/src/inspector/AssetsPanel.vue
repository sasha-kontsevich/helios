<template>
  <div class="assets-panel helios-scroll">
    <section class="assets-panel__section">
      <h3 class="assets-panel__title">Models</h3>
      <ModelAssetsPanel
        ref="modelPanelRef"
        :engine-api="engineApi"
        :tab-active="tabActive"
        @spawn="(g) => emit('spawnModel', g)"
      />
    </section>
    <section class="assets-panel__section">
      <h3 class="assets-panel__title">Textures</h3>
      <TextureAssetsPanel
        ref="texturePanelRef"
        :engine-api="engineApi"
        :tab-active="tabActive"
        :can-apply="canApplyTexture"
        @copy-guid="onCopyGuid"
        @apply-map="(g) => emit('applyTextureMap', g)"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { EngineAPI } from "@merlinn/helios-core";
import ModelAssetsPanel from "./ModelAssetsPanel.vue";
import TextureAssetsPanel from "./TextureAssetsPanel.vue";

defineProps<{
  engineApi: EngineAPI;
  tabActive?: boolean;
  canApplyTexture?: boolean;
}>();

const emit = defineEmits<{
  spawnModel: [guid: string];
  applyTextureMap: [guid: string];
}>();

const modelPanelRef = ref<InstanceType<typeof ModelAssetsPanel> | null>(null);
const texturePanelRef = ref<InstanceType<typeof TextureAssetsPanel> | null>(null);

function onCopyGuid(guid: string): void {
  void navigator.clipboard.writeText(guid).then(() => {
    texturePanelRef.value?.showToast?.("GUID copied");
  });
}

function refresh(): void {
  modelPanelRef.value?.refresh?.();
  texturePanelRef.value?.refresh?.();
}

function showToast(msg: string): void {
  modelPanelRef.value?.showToast?.(msg);
  texturePanelRef.value?.showToast?.(msg);
}

defineExpose({ refresh, showToast });
</script>

<style scoped>
.assets-panel {
  height: 100%;
  min-height: 0;
}
.assets-panel__section + .assets-panel__section {
  border-top: 1px solid var(--helios-border, #333);
  margin-top: 4px;
}
.assets-panel__title {
  margin: 8px 10px 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--helios-muted, #888);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
</style>
