<template>
  <footer
    class="statusbar"
    :class="{ 'statusbar--active': snapshot.active }"
    role="status"
    aria-live="polite"
    :aria-busy="snapshot.active"
  >
    <span v-if="snapshot.active" class="statusbar__spinner" aria-hidden="true" />
    <span class="statusbar__message">{{ snapshot.message }}</span>
  </footer>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef } from "vue";
import type { AssetLoadStatusSnapshot, EngineAPI } from "@merlinn/helios-core";

const props = defineProps<{
  engineApi: EngineAPI;
}>();

const snapshot = shallowRef<AssetLoadStatusSnapshot>(props.engineApi.getAssetLoadStatus());

let unsubscribe: (() => void) | undefined;

function syncSnapshot(): void {
  snapshot.value = props.engineApi.getAssetLoadStatus();
}

onMounted(() => {
  syncSnapshot();
  unsubscribe = props.engineApi.subscribeAssetLoadStatus(syncSnapshot);
});

onUnmounted(() => {
  unsubscribe?.();
  unsubscribe = undefined;
});
</script>

<style scoped>
.statusbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  height: var(--helios-statusbar-height);
  padding: 0 var(--helios-chrome-row-pad-x);
  border-top: 1px solid var(--helios-color-border);
  background: #252525;
  color: #6b7280;
  font-size: 11px;
  user-select: none;
  min-height: 0;
}

.statusbar--active {
  color: #d1d5db;
}

.statusbar__message {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
}

.statusbar__spinner {
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  border: 2px solid #444;
  border-top-color: #5a8ab8;
  border-radius: 50%;
  animation: statusbar-spin 0.7s linear infinite;
}

@keyframes statusbar-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
