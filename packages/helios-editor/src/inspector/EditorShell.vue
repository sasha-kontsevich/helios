<template>
  <div class="shell">
    <aside class="shell__left">
      <EntityListPanel
        :entities="entities"
        :selected-eid="selectedEid"
        @select="onSelect"
      />
    </aside>
    <main class="shell__center">
      <canvas id="three-scene" class="shell__canvas"></canvas>
    </main>
    <aside class="shell__right">
      <InspectorPanel
        :selected-eid="selectedEid"
        :snapshot="inspectorSnapshot"
        :available-components="availableComponents"
        @apply-patch="onApplyPatch"
        @editing-changed="onEditingChanged"
        @add-component="onAddComponent"
        @remove-component="onRemoveComponent"
      />
    </aside>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, shallowRef, watch } from "vue";
import type { ComponentMap, EngineAPI, EntitySnapshot } from "@merlinn/helios-core";
import EntityListPanel from "./EntityListPanel.vue";
import InspectorPanel from "./InspectorPanel.vue";

const REFRESH_MS = 160;

const props = defineProps<{
  engineApi: EngineAPI;
}>();

const entities = shallowRef<EntitySnapshot[]>([]);
const selectedEid = ref<number | null>(null);

const inspectorSnapshot = ref<EntitySnapshot | null>(null);
const inspectorEditing = ref(false);
const availableComponents = ref<string[]>([]);

let pollTimer: ReturnType<typeof setInterval> | undefined;

function sortEntities(list: EntitySnapshot[]): EntitySnapshot[] {
  return [...list].sort((a, b) => a.eid - b.eid);
}

function refreshEntityList(): void {
  const list = props.engineApi.getAllEntities();
  entities.value = sortEntities(list);
  // Components are registered during engine.init; editor mounts before init, so refresh over time.
  availableComponents.value = props.engineApi.listRegisteredComponents();
  if (entities.value.length === 0) {
    console.warn(
      "[HeliosEditor] Entity list is empty. If you expect entities, check that systems create them and components are registered.",
    );
  }
}

function refreshInspector(): void {
  const id = selectedEid.value;
  if (id === null) {
    inspectorSnapshot.value = null;
    return;
  }
  inspectorSnapshot.value = props.engineApi.getEntitySnapshot(id);
}

function onSelect(eid: number): void {
  selectedEid.value = eid;
  refreshInspector();
}

function onApplyPatch(payload: { componentName: string; patch: Record<string, number> }): void {
  const id = selectedEid.value;
  if (id === null) return;
  props.engineApi.applyComponentPatch(id, payload.componentName as keyof ComponentMap, payload.patch);
  // Avoid fighting the user's input. Snapshot will refresh via polling when not editing.
}

function onAddComponent(componentName: string): void {
  const id = selectedEid.value;
  if (id === null) return;
  props.engineApi.addComponent(id, componentName as keyof ComponentMap);
  refreshInspector();
  refreshEntityList();
}

function onRemoveComponent(componentName: string): void {
  const id = selectedEid.value;
  if (id === null) return;
  props.engineApi.removeComponent(id, componentName as keyof ComponentMap);
  refreshInspector();
  refreshEntityList();
}

function onEditingChanged(isEditing: boolean): void {
  inspectorEditing.value = isEditing;
  if (!isEditing) {
    refreshInspector();
  }
}

watch(selectedEid, () => {
  refreshInspector();
});

onMounted(() => {
  refreshEntityList();
  refreshInspector();
  pollTimer = setInterval(() => {
    refreshEntityList();
    if (!inspectorEditing.value) {
      refreshInspector();
    }
  }, REFRESH_MS);
});

onUnmounted(() => {
  if (pollTimer !== undefined) {
    clearInterval(pollTimer);
  }
});
</script>

<style scoped>
.shell {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: #1a1a1a;
  color: #e0e0e0;
}
.shell__left {
  width: 240px;
  flex-shrink: 0;
  border-right: 1px solid #333;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.shell__center {
  flex: 1;
  min-width: 0;
  min-height: 0;
  position: relative;
  background: #222;
}
.shell__canvas {
  display: block;
  width: 100%;
  height: 100%;
}
.shell__right {
  width: 280px;
  flex-shrink: 0;
  border-left: 1px solid #333;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
