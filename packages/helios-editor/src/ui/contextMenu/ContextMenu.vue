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
      <template v-for="entry in items" :key="entry.id">
        <button
          v-if="!isSubmenu(entry)"
          type="button"
          class="ctx-menu__item"
          :class="{ 'ctx-menu__item--danger': entry.danger, 'ctx-menu__item--disabled': entry.disabled }"
          :disabled="entry.disabled"
          role="menuitem"
          @click="onPick(entry)"
        >
          <span class="ctx-menu__label">{{ entry.label }}</span>
          <span v-if="entry.shortcut" class="ctx-menu__shortcut">{{ entry.shortcut }}</span>
        </button>
        <div
          v-else
          class="ctx-menu__submenu-wrap"
          :class="{ 'ctx-menu__submenu-wrap--disabled': entry.disabled }"
        >
          <button
            type="button"
            class="ctx-menu__item ctx-menu__submenu-trigger"
            :disabled="entry.disabled"
            aria-haspopup="true"
          >
            <span class="ctx-menu__label">{{ entry.label }}</span>
            <span class="ctx-menu__caret" aria-hidden="true">▸</span>
          </button>
          <div class="ctx-menu__flyout" role="menu">
            <button
              v-for="child in entry.children"
              :key="`${entry.id}-${child.id}`"
              type="button"
              class="ctx-menu__item"
              :class="{ 'ctx-menu__item--danger': child.danger, 'ctx-menu__item--disabled': child.disabled }"
              :disabled="child.disabled"
              role="menuitem"
              @click="onPick(child)"
            >
              <span class="ctx-menu__label">{{ child.label }}</span>
              <span v-if="child.shortcut" class="ctx-menu__shortcut">{{ child.shortcut }}</span>
            </button>
          </div>
        </div>
      </template>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { ContextMenuEntry, ContextMenuItem } from "./contextMenuTypes";
import { isContextMenuSubmenu } from "./contextMenuTypes";

defineProps<{
  visible: boolean;
  x: number;
  y: number;
  items: ContextMenuEntry[];
}>();

const emit = defineEmits<{
  close: [];
}>();

function isSubmenu(e: ContextMenuEntry) {
  return isContextMenuSubmenu(e);
}

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

.ctx-menu__caret {
  flex-shrink: 0;
  font-size: 10px;
  color: #aaa;
  margin-left: 8px;
}

.ctx-menu__submenu-wrap {
  position: relative;
}

.ctx-menu__submenu-wrap:hover:not(.ctx-menu__submenu-wrap--disabled) .ctx-menu__flyout {
  display: block;
}

.ctx-menu__submenu-wrap--disabled .ctx-menu__flyout {
  display: none !important;
}

.ctx-menu__submenu-trigger {
  width: 100%;
}

.ctx-menu__flyout {
  display: none;
  position: absolute;
  left: calc(100% - 6px);
  top: 0;
  min-width: 140px;
  padding: 4px 0;
  margin: 0;
  background: #2a2a2a;
  border: 1px solid #555;
  border-radius: 4px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
  z-index: 1;
}

.ctx-menu__flyout .ctx-menu__item {
  padding: 6px 12px;
}
</style>
