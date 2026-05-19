<template>
  <div
    class="entity-list"
    :class="{ 'entity-list--drop-root': dropTargetRoot }"
    @contextmenu.prevent="onPanelContextMenu"
    @dragover.prevent="onRootDragOver"
    @dragleave="onRootDragLeave"
    @drop.prevent="onRootDrop"
  >
    <ul class="entity-list__ul entity-tree">
      <EntityHierarchyNode
        v-for="node in treeRoots"
        :key="node.eid"
        :node="node"
        :depth="0"
        :selected-eid="selectedEid"
        :expanded-ids="expandedIds"
        :drop-target-eid="dropTargetEid"
        :label="hierarchyNodeLabel(node)"
        :component-summary="componentSummary(node.snapshot)"
        @select="$emit('select', $event)"
        @toggle-expand="toggleExpand"
        @row-context-menu="onRowContextMenu"
        @drag-start="onDragStart"
        @drag-end="onDragEnd"
        @drag-over="onDragOver"
        @drag-leave="onDragLeave"
        @drop="onDrop"
      />
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
import { computed, ref, watch } from "vue";
import type { EngineAPI, EntitySnapshot } from "@merlinn/helios-core";
import ContextMenu from "../ui/contextMenu/ContextMenu.vue";
import type { ContextMenuEntry, ContextMenuItem } from "../ui/contextMenu/contextMenuTypes";
import { useContextMenu } from "../ui/contextMenu/useContextMenu";
import {
  EDITOR_PRIMITIVE_KINDS,
  EDITOR_PRIMITIVE_NAME_LABELS,
  type EditorPrimitiveKind,
} from "../presets/defaultEditorPrimitiveComponents";
import EntityHierarchyNode from "./EntityHierarchyNode.vue";
import {
  buildEditorEntityHierarchy,
  canReparentEntity,
  hierarchyNodeLabel,
} from "./entityHierarchyTree";

const props = defineProps<{
  entities: EntitySnapshot[];
  selectedEid: number | null;
  engineApi: EngineAPI;
}>();

const emit = defineEmits<{
  select: [eid: number];
  create: [];
  createPrimitive: [kind: EditorPrimitiveKind];
  delete: [eid: number];
  copy: [eid: number];
  paste: [];
  reparented: [];
}>();

const { visible: ctxVisible, x: ctxX, y: ctxY, items: ctxItems, open, close: closeContextMenu } =
  useContextMenu();

const expandedIds = ref<Set<number>>(new Set());
const draggingEid = ref<number | null>(null);
const dropTargetEid = ref<number | null>(null);
const dropTargetRoot = ref(false);

const treeRoots = computed(() => buildEditorEntityHierarchy(props.entities));

watch(
  () => props.entities,
  (list) => {
    const valid = new Set(list.map((e) => e.eid));
    const next = new Set<number>();
    for (const eid of expandedIds.value) {
      if (valid.has(eid)) {
        next.add(eid);
      }
    }
    expandedIds.value = next;
  },
);

function toggleExpand(eid: number): void {
  const next = new Set(expandedIds.value);
  if (next.has(eid)) {
    next.delete(eid);
  } else {
    next.add(eid);
  }
  expandedIds.value = next;
}

function componentSummary(ent: EntitySnapshot): string {
  const names = Object.keys(ent.components).filter((n) => n !== "Name" && n !== "Parent");
  if (names.length === 0) {
    return "";
  }
  return names.slice(0, 5).join(", ") + (names.length > 5 ? "…" : "");
}

function onPanelContextMenu(ev: MouseEvent): void {
  const t = ev.target;
  if (t instanceof Element && t.closest(".entity-tree__row")) {
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

function onDragStart(eid: number, ev: DragEvent): void {
  draggingEid.value = eid;
  if (ev.dataTransfer) {
    ev.dataTransfer.effectAllowed = "move";
    ev.dataTransfer.setData("text/plain", String(eid));
  }
}

function onDragEnd(): void {
  draggingEid.value = null;
  dropTargetEid.value = null;
  dropTargetRoot.value = false;
}

function onDragOver(eid: number): void {
  dropTargetRoot.value = false;
  const dragged = draggingEid.value;
  if (dragged === null) {
    return;
  }
  if (canReparentEntity(dragged, eid, props.entities)) {
    dropTargetEid.value = eid;
  }
}

function onDragLeave(): void {
  dropTargetEid.value = null;
}

function onDrop(targetEid: number): void {
  const dragged = draggingEid.value;
  if (dragged === null) {
    return;
  }
  if (!canReparentEntity(dragged, targetEid, props.entities)) {
    onDragEnd();
    return;
  }
  props.engineApi.setEntityParent(dragged, targetEid);
  expandedIds.value = new Set(expandedIds.value).add(targetEid);
  emit("reparented");
  onDragEnd();
}

function onRootDragOver(): void {
  const dragged = draggingEid.value;
  if (dragged === null) {
    return;
  }
  dropTargetEid.value = null;
  if (canReparentEntity(dragged, null, props.entities)) {
    dropTargetRoot.value = true;
  }
}

function onRootDragLeave(): void {
  dropTargetRoot.value = false;
}

function onRootDrop(): void {
  const dragged = draggingEid.value;
  if (dragged === null) {
    return;
  }
  if (!canReparentEntity(dragged, null, props.entities)) {
    onDragEnd();
    return;
  }
  props.engineApi.setEntityParent(dragged, null);
  emit("reparented");
  onDragEnd();
}
</script>

<style scoped>
.entity-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.entity-list--drop-root {
  outline: 1px dashed #6af;
  outline-offset: -2px;
}
.entity-list__ul {
  list-style: none;
  margin: 0;
  padding: 4px 0;
  overflow: auto;
  flex: 1;
  min-height: 0;
}
.entity-tree {
  padding: 0;
}
</style>
