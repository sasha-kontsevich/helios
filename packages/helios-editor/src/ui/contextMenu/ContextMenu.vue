<template>
  <Teleport to="body">
    <div
      v-show="visible"
      ref="rootEl"
      class="ctx-menu"
      data-context-menu-root="true"
      :style="{ left: `${displayX}px`, top: `${displayY}px` }"
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
          @mouseenter="onSubmenuEnter(entry.id, $event)"
          @mouseleave="onSubmenuLeave(entry.id, $event)"
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
          <div
            class="ctx-menu__flyout"
            :class="{ 'ctx-menu__flyout--flip-left': flyoutFlipLeft[entry.id] }"
            role="menu"
          >
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
import { nextTick, ref, watch } from "vue";
import type { ContextMenuEntry, ContextMenuItem } from "./contextMenuTypes";
import { isContextMenuSubmenu } from "./contextMenuTypes";
import { clampFixedMenuPosition, VIEWPORT_MARGIN } from "./clampContextMenuToViewport";

const props = defineProps<{
  visible: boolean;
  x: number;
  y: number;
  items: ContextMenuEntry[];
}>();

const emit = defineEmits<{
  close: [];
}>();

const rootEl = ref<HTMLElement | null>(null);
const displayX = ref(0);
const displayY = ref(0);
/** Open flyout to the left of the submenu row when there is not enough space on the right. */
const flyoutFlipLeft = ref<Record<string, boolean>>({});

watch(
  () => [props.visible, props.x, props.y, props.items] as const,
  async ([vis, px, py]) => {
    if (!vis) {
      flyoutFlipLeft.value = {};
      return;
    }
    displayX.value = px;
    displayY.value = py;
    await nextTick();
    requestAnimationFrame(() => {
      const el = rootEl.value;
      if (!el || !props.visible) {
        return;
      }
      const r = el.getBoundingClientRect();
      const c = clampFixedMenuPosition(px, py, r.width, r.height);
      displayX.value = c.left;
      displayY.value = c.top;
    });
  },
);

function onSubmenuEnter(entryId: string, ev: MouseEvent): void {
  const wrap = ev.currentTarget as HTMLElement | null;
  if (!wrap || wrap.classList.contains("ctx-menu__submenu-wrap--disabled")) {
    return;
    }
    requestAnimationFrame(() => {
      const flyout = wrap.querySelector(".ctx-menu__flyout") as HTMLElement | null;
      if (!flyout) {
        return;
      }
      const fr = flyout.getBoundingClientRect();
      const flip = fr.right > window.innerWidth - VIEWPORT_MARGIN;
      flyoutFlipLeft.value = { ...flyoutFlipLeft.value, [entryId]: flip };
    });
}

function onSubmenuLeave(entryId: string, _ev: MouseEvent): void {
  const next = { ...flyoutFlipLeft.value };
  delete next[entryId];
  flyoutFlipLeft.value = next;
}

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
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial,
    "Noto Sans", "Liberation Sans", sans-serif;
  font-size: var(--helios-menu-font-size);
  color: #e8e8e8;
}

.ctx-menu__item {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  box-sizing: border-box;
  min-height: var(--helios-menu-row-height);
  padding: 0 var(--helios-menu-row-pad-x);
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
  right: auto;
  top: 0;
  min-width: 140px;
  max-width: min(280px, calc(100vw - 16px));
  max-height: min(70vh, calc(100vh - 2 * 12px));
  overflow-x: hidden;
  overflow-y: auto;
  padding: 4px 0;
  margin: 0;
  background: #2a2a2a;
  border: 1px solid #555;
  border-radius: 4px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
  z-index: 1;
}

.ctx-menu__flyout--flip-left {
  left: auto;
  right: calc(100% - 6px);
}

.ctx-menu__flyout .ctx-menu__item {
  min-height: var(--helios-menu-row-height);
  padding: 0 var(--helios-menu-row-pad-x);
}
</style>
