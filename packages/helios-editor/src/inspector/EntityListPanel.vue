<template>
  <div class="entity-list" @contextmenu.prevent="onPanelContextMenu">
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
          <span v-if="entityNameOnly(ent)" class="entity-list__name">{{ entityNameOnly(ent) }}</span>
          <span class="entity-list__comps">{{ componentSummary(ent) }}</span>
        </li>
      </ul>
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
import type { ContextMenuEntry, ContextMenuItem } from "../ui/contextMenu/contextMenuTypes";
import { useContextMenu } from "../ui/contextMenu/useContextMenu";
import {
  EDITOR_PRIMITIVE_KINDS,
  EDITOR_PRIMITIVE_NAME_LABELS,
  type EditorPrimitiveKind,
} from "../presets/defaultEditorPrimitiveComponents";
import { entityNameOnly } from "../utils/entityDisplayLabel";

const props = defineProps<{
  entities: EntitySnapshot[];
  selectedEid: number | null;
}>();

const emit = defineEmits<{
  select: [eid: number];
  create: [];
  createPrimitive: [kind: EditorPrimitiveKind];
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
  const primitiveChildren: ContextMenuItem[] = EDITOR_PRIMITIVE_KINDS.map((kind) => ({
    id: `primitive-${kind}`,
    label: EDITOR_PRIMITIVE_NAME_LABELS[kind],
    onSelect: () => {
      emit("createPrimitive", kind);
    },
  }));

  const panelItems: ContextMenuEntry[] = [
    {
      id: "new",
      label: "New",
      onSelect: () => {
        emit("create");
      },
    },
    {
      id: "primitives",
      label: "Primitive",
      children: primitiveChildren,
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
  const names = Object.keys(ent.components).filter((n) => n !== "Name");
  if (names.length === 0) return "";
  return names.slice(0, 5).join(", ") + (names.length > 5 ? "…" : "");
}
</script>

<style scoped>
.entity-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
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
  flex-direction: row;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  min-height: var(--helios-list-row-height);
  padding: 0 var(--helios-list-row-pad-x);
  cursor: pointer;
  font-size: 12px;
  color: #ddd;
  min-width: 0;
}
.entity-list__item:hover {
  background: #2a2a2a;
}
.entity-list__item--active {
  background: #1e3a5f;
}
.entity-list__eid {
  flex: 0 0 auto;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: #8cf;
}
.entity-list__name {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 55%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  color: #e8e8e8;
}
.entity-list__comps {
  flex: 1 1 0;
  min-width: 0;
  font-size: 11px;
  color: #888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
