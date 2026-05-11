<template>
  <div class="entity-list" @contextmenu.prevent="onPanelContextMenu">
    <div class="entity-list__header">
      <span>Entities</span>
    </div>
    <div class="entity-list__body">
      <ul class="entity-list__ul">
        <li
          v-for="ent in entities"
          :key="ent.eid"
          class="entity-list__item"
          :class="{ 'entity-list__item--active': ent.eid === selectedEid }"
          @click="$emit('select', ent.eid)"
          @contextmenu.stop.prevent="onRowContextMenu($event, ent.eid)"
        >
          <span class="entity-list__eid">{{ ent.eid }}</span>
          <span class="entity-list__hint">{{ componentSummary(ent) }}</span>
        </li>
      </ul>
    </div>
    <ContextMenu
      :visible="ctxVisible"
      :x="ctxX"
      :y="ctxY"
      :items="ctxItems"
      @close="closeContextMenu"
    />
  </div>
</template>

<script setup lang="ts">
import type { EntitySnapshot } from "@merlinn/helios-core";
import ContextMenu from "../ui/contextMenu/ContextMenu.vue";
import type { ContextMenuItem } from "../ui/contextMenu/contextMenuTypes";
import { useContextMenu } from "../ui/contextMenu/useContextMenu";

const props = defineProps<{
  entities: EntitySnapshot[];
  selectedEid: number | null;
}>();

const emit = defineEmits<{
  select: [eid: number];
  create: [];
  delete: [eid: number];
  copy: [eid: number];
  paste: [];
}>();

const { visible: ctxVisible, x: ctxX, y: ctxY, items: ctxItems, open, close: closeContextMenu } =
  useContextMenu();

function onPanelContextMenu(ev: MouseEvent): void {
  const t = ev.target;
  if (t instanceof Element && t.closest(".entity-list__item")) {
    return;
  }
  const sel = props.selectedEid;
  const panelItems: ContextMenuItem[] = [
    {
      id: "new",
      label: "New",
      onSelect: () => {
        emit("create");
      },
    },
    {
      id: "paste",
      label: "Paste",
      shortcut: "Ctrl+V",
      onSelect: () => {
        emit("paste");
      },
    },
    {
      id: "copy",
      label: "Copy",
      shortcut: "Ctrl+C",
      disabled: sel === null,
      onSelect: () => {
        if (sel !== null) emit("copy", sel);
      },
    },
    {
      id: "delete",
      label: "Delete",
      danger: true,
      disabled: sel === null,
      onSelect: () => {
        if (sel !== null) emit("delete", sel);
      },
    },
  ];
  open(ev.clientX, ev.clientY, panelItems);
}

function onRowContextMenu(ev: MouseEvent, eid: number): void {
  const rowItems: ContextMenuItem[] = [
    {
      id: "copy-row",
      label: "Copy",
      shortcut: "Ctrl+C",
      onSelect: () => {
        emit("copy", eid);
      },
    },
    {
      id: "delete-row",
      label: "Delete",
      danger: true,
      onSelect: () => {
        emit("delete", eid);
      },
    },
  ];
  open(ev.clientX, ev.clientY, rowItems);
}

function componentSummary(ent: EntitySnapshot): string {
  const names = Object.keys(ent.components);
  if (names.length === 0) return "";
  return names.slice(0, 3).join(", ") + (names.length > 3 ? "…" : "");
}
</script>

<style scoped>
.entity-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.entity-list__header {
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #bbb;
  border-bottom: 1px solid #333;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  flex-shrink: 0;
}
.entity-list__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.entity-list__ul {
  list-style: none;
  margin: 0;
  padding: 4px 0;
  overflow: auto;
  flex: 1;
  min-height: 0;
}
.entity-list__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 12px;
  color: #ddd;
}
.entity-list__item:hover {
  background: #2a2a2a;
}
.entity-list__item--active {
  background: #1e3a5f;
}
.entity-list__eid {
  font-family: ui-monospace, monospace;
  color: #8cf;
}
.entity-list__hint {
  font-size: 11px;
  color: #888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
