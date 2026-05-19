<template>
  <li class="entity-tree__branch">
    <div
      class="entity-tree__row"
      :class="{
        'entity-tree__row--active': node.eid === selectedEid,
        'entity-tree__row--drop': dropTargetEid === node.eid,
      }"
      :style="{ paddingLeft: `${8 + depth * 14}px` }"
      draggable="true"
      @click="$emit('select', node.eid)"
      @contextmenu.stop.prevent="$emit('rowContextMenu', $event, node.eid)"
      @dragstart="onDragStart"
      @dragend="$emit('dragEnd')"
      @dragover.prevent="onDragOver"
      @dragleave="$emit('dragLeave')"
      @drop.prevent="onDrop"
    >
      <button
        v-if="node.children.length > 0"
        type="button"
        class="entity-tree__chevron"
        :aria-expanded="expanded"
        @click.stop="$emit('toggleExpand', node.eid)"
      >
        {{ expanded ? "▼" : "▶" }}
      </button>
      <span v-else class="entity-tree__chevron entity-tree__chevron--spacer" />
      <span class="entity-tree__label" :title="`eid ${node.eid}`">{{ label }}</span>
      <span class="entity-tree__comps">{{ componentSummary }}</span>
    </div>
    <ul v-if="expanded && node.children.length > 0" class="entity-tree__children">
      <EntityHierarchyNode
        v-for="child in node.children"
        :key="child.eid"
        :node="child"
        :depth="depth + 1"
        :selected-eid="selectedEid"
        :expanded-ids="expandedIds"
        :drop-target-eid="dropTargetEid"
        :label="childLabel(child)"
        :component-summary="childSummary(child)"
        @select="$emit('select', $event)"
        @toggle-expand="$emit('toggleExpand', $event)"
        @row-context-menu="(ev, eid) => $emit('rowContextMenu', ev, eid)"
        @drag-start="(eid, ev) => $emit('dragStart', eid, ev)"
        @drag-end="$emit('dragEnd')"
        @drag-over="(eid) => $emit('dragOver', eid)"
        @drag-leave="$emit('dragLeave')"
        @drop="(eid) => $emit('drop', eid)"
      />
    </ul>
  </li>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { HierarchyNode } from "./entityHierarchyTree";
import { hierarchyNodeLabel } from "./entityHierarchyTree";

defineOptions({ name: "EntityHierarchyNode" });

const props = defineProps<{
  node: HierarchyNode;
  depth: number;
  selectedEid: number | null;
  expandedIds: ReadonlySet<number>;
  dropTargetEid: number | null;
  label: string;
  componentSummary: string;
}>();

const emit = defineEmits<{
  select: [eid: number];
  toggleExpand: [eid: number];
  rowContextMenu: [event: MouseEvent, eid: number];
  dragStart: [eid: number, event: DragEvent];
  dragEnd: [];
  dragOver: [eid: number];
  dragLeave: [];
  drop: [eid: number];
}>();

const expanded = computed(() => props.expandedIds.has(props.node.eid));

function childLabel(node: HierarchyNode): string {
  return hierarchyNodeLabel(node);
}

function childSummary(node: HierarchyNode): string {
  const names = Object.keys(node.snapshot.components).filter((n) => n !== "Name" && n !== "Parent");
  if (names.length === 0) {
    return "";
  }
  return names.slice(0, 4).join(", ") + (names.length > 4 ? "…" : "");
}

function onDragStart(ev: DragEvent): void {
  emit("dragStart", props.node.eid, ev);
}

function onDragOver(): void {
  emit("dragOver", props.node.eid);
}

function onDrop(): void {
  emit("drop", props.node.eid);
}
</script>

<style scoped>
.entity-tree__branch {
  list-style: none;
}
.entity-tree__children {
  list-style: none;
  margin: 0;
  padding: 0;
}
.entity-tree__row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  box-sizing: border-box;
  min-height: var(--helios-list-row-height);
  padding-right: var(--helios-list-row-pad-x);
  cursor: pointer;
  font-size: 12px;
  color: #ddd;
  min-width: 0;
}
.entity-tree__row:hover {
  background: #2a2a2a;
}
.entity-tree__row--active {
  background: #1e3a5f;
}
.entity-tree__row--drop {
  outline: 1px solid #6af;
  background: #243448;
}
.entity-tree__chevron {
  flex: 0 0 16px;
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  background: transparent;
  color: #aaa;
  font-size: 9px;
  line-height: 16px;
  cursor: pointer;
}
.entity-tree__chevron--spacer {
  display: inline-block;
  cursor: default;
}
.entity-tree__label {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 50%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  color: #e8e8e8;
}
.entity-tree__comps {
  flex: 1 1 0;
  min-width: 0;
  font-size: 11px;
  color: #888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
