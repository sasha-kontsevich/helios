<template>
  <div class="entity-list">
    <div class="entity-list__header">Entities</div>
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
