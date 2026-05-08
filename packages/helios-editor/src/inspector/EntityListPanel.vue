<template>
  <div class="entity-list">
    <div class="entity-list__header">
      <span>Entities</span>
      <div class="entity-list__actions">
        <button class="entity-list__btn" type="button" @click="$emit('create')">New</button>
        <button
          class="entity-list__icon-btn"
          type="button"
          title="Delete selected entity"
          :aria-label="`Delete entity ${selectedEid ?? ''}`"
          :disabled="selectedEid === null"
          @click="selectedEid !== null && $emit('delete', selectedEid)"
        >
          ×
        </button>
      </div>
    </div>
    <ul class="entity-list__ul">
      <li
        v-for="ent in entities"
        :key="ent.eid"
        class="entity-list__item"
        :class="{ 'entity-list__item--active': ent.eid === selectedEid }"
        @click="$emit('select', ent.eid)"
      >
        <span class="entity-list__eid">{{ ent.eid }}</span>
        <span class="entity-list__hint">{{ componentSummary(ent) }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { EntitySnapshot } from "@merlinn/helios-core";

defineProps<{
  entities: EntitySnapshot[];
  selectedEid: number | null;
}>();

defineEmits<{
  select: [eid: number];
  create: [];
  delete: [eid: number];
}>();

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
  justify-content: space-between;
  gap: 8px;
}
.entity-list__actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.entity-list__btn {
  height: 22px;
  padding: 0 8px;
  font-size: 11px;
  color: #eee;
  background: #1b1b1b;
  border: 1px solid #444;
  border-radius: 2px;
  cursor: pointer;
}
.entity-list__icon-btn {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  line-height: 1;
  color: #ddd;
  background: transparent;
  border: 1px solid #444;
  border-radius: 2px;
  cursor: pointer;
}
.entity-list__icon-btn:disabled {
  opacity: 0.5;
  cursor: default;
}
.entity-list__icon-btn:not(:disabled):hover {
  background: #2a1515;
  border-color: #5a2a2a;
  color: #fff;
}
.entity-list__ul {
  list-style: none;
  margin: 0;
  padding: 4px 0;
  overflow: auto;
  flex: 1;
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
