<template>
  <Teleport to="body">
    <div
      v-show="visible"
      class="ctx-menu"
      data-context-menu-root="true"
      :style="{ left: `${x}px`, top: `${y}px` }"
      role="menu"
      @contextmenu.prevent
    >
      <button
        v-for="it in items"
        :key="it.id"
        type="button"
        class="ctx-menu__item"
        :class="{ 'ctx-menu__item--danger': it.danger, 'ctx-menu__item--disabled': it.disabled }"
        :disabled="it.disabled"
        role="menuitem"
        @click="onPick(it)"
      >
        <span class="ctx-menu__label">{{ it.label }}</span>
        <span v-if="it.shortcut" class="ctx-menu__shortcut">{{ it.shortcut }}</span>
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { ContextMenuItem } from "./contextMenuTypes";

defineProps<{
  visible: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
}>();

const emit = defineEmits<{
  close: [];
}>();

function onPick(it: ContextMenuItem): void {
  if (it.disabled) {
    return;
  }
  it.onSelect();
  emit("close");
}
</script>

<style scoped>
.ctx-menu {
  position: fixed;
  z-index: 20000;
  min-width: 160px;
  max-width: 280px;
  padding: 4px 0;
  margin: 0;
  list-style: none;
  background: #2a2a2a;
  border: 1px solid #555;
  border-radius: 4px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
  font-size: 12px;
  color: #e8e8e8;
}

.ctx-menu__item {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.ctx-menu__item:hover:not(:disabled) {
  background: #3a3a3a;
}

.ctx-menu__item--disabled {
  opacity: 0.45;
  cursor: default;
}

.ctx-menu__item--danger:not(:disabled) {
  color: #f88;
}

.ctx-menu__shortcut {
  flex-shrink: 0;
  font-size: 11px;
  color: #888;
}
</style>
