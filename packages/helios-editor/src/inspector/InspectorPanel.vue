<template>
  <div class="inspector" @contextmenu="onInspectorPanelContextMenu">
    <div class="inspector__header">
      <span>Components</span>
      <label class="inspector__devToggle">
        <input v-model="showRuntimeInternals" type="checkbox" />
        <span>Внутр. Three.js</span>
      </label>
    </div>
    <div v-if="selectedEid === null" class="inspector__empty">Select an entity</div>
    <div v-else-if="snapshot" class="inspector__body">
      <section v-for="sec in sections" :key="sec.name" class="inspector__component">
        <div
          class="inspector__comp-row"
          @contextmenu.stop.prevent="onComponentRowContextMenu($event, sec.name)"
        >
          <h3 class="inspector__comp-title">{{ sec.name }}</h3>
          <div class="inspector__comp-actions">
            <button
              v-if="sec.ext?.supportsRaw"
              type="button"
              class="inspector__rawBtn"
              @click="toggleRaw(sec.name)"
            >
              {{ rawModeFor(sec.name) ? "Форма" : "Raw" }}
            </button>
          </div>
        </div>
        <component
          v-if="sec.ext"
          :is="sec.ext.view"
          :component-name="sec.name"
          :fields="sec.fields"
          :selected-eid="selectedEid"
          :raw-mode="rawModeFor(sec.name)"
          :show-uniform-lock="sec.name === 'Scale'"
          @apply-patch="onApplyPatch"
          @editing-changed="onEditingChanged"
        />
        <GenericComponentFields
          v-else
          :component-name="sec.name"
          :fields="sec.fields"
          :selected-eid="selectedEid"
          @apply-patch="onApplyPatch"
          @editing-changed="onEditingChanged"
        />
      </section>
    </div>
    <div v-else class="inspector__empty">No snapshot</div>
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
import { computed, reactive, ref } from "vue";
import type { EntitySnapshot } from "@merlinn/helios-core";
import ContextMenu from "../ui/contextMenu/ContextMenu.vue";
import type { ContextMenuEntry, ContextMenuItem } from "../ui/contextMenu/contextMenuTypes";
import { useContextMenu } from "../ui/contextMenu/useContextMenu";
import GenericComponentFields from "./GenericComponentFields.vue";
import { isInternalInspectorComponent } from "./internalComponents";
import { createDefaultInspectorRegistry } from "./registry/createDefaultInspectorRegistry";
import type { EditorInspectorRegistry } from "./registry/EditorInspectorRegistry";

let sharedDefaultInspectorRegistry: EditorInspectorRegistry | null = null;

function getSharedDefaultInspectorRegistry(): EditorInspectorRegistry {
    if (!sharedDefaultInspectorRegistry) {
        sharedDefaultInspectorRegistry = createDefaultInspectorRegistry();
    }
    return sharedDefaultInspectorRegistry;
}

const props = defineProps<{
    selectedEid: number | null;
    snapshot: EntitySnapshot | null;
    availableComponents?: string[];
    /** When omitted, uses a process-wide default registry (built-in inspectors only). */
    inspectorRegistry?: EditorInspectorRegistry;
}>();

const emit = defineEmits<{
  applyPatch: [payload: { componentName: string; patch: Record<string, unknown> }];
  editingChanged: [isEditing: boolean];
  addComponent: [componentName: string];
  removeComponent: [componentName: string];
  copyComponent: [componentName: string];
  pasteComponents: [];
}>();

const showRuntimeInternals = ref(false);
/** Per ECS component type name (not per-entity). */
const componentRawMode = reactive<Record<string, boolean>>({});

const registry = computed(() => props.inspectorRegistry ?? getSharedDefaultInspectorRegistry());

const sections = computed(() => {
  const snap = props.snapshot;
  if (!snap) return [];
  return Object.entries(snap.components)
    .filter(([name]) => !isInternalInspectorComponent(name) || showRuntimeInternals.value)
    .map(([name, fields]) => ({
      name,
      fields: fields as Record<string, unknown>,
      ext: registry.value.resolve(name),
    }));
});

function rawModeFor(compName: string): boolean {
  return Boolean(componentRawMode[compName]);
}

function toggleRaw(compName: string): void {
  componentRawMode[compName] = !rawModeFor(compName);
}

function onApplyPatch(payload: { componentName: string; patch: Record<string, unknown> }): void {
  emit("applyPatch", payload);
}

function onEditingChanged(isEditing: boolean): void {
  emit("editingChanged", isEditing);
}

const availableComponents = computed(() => props.availableComponents ?? []);

const { visible: ctxVisible, x: ctxX, y: ctxY, items: ctxItems, open, close: closeContextMenu } =
  useContextMenu();

const missingComponents = computed(() => {
  const snap = props.snapshot;
  const list = availableComponents.value;
  if (!snap) return list;
  return list.filter((name) => !Object.prototype.hasOwnProperty.call(snap.components, name));
});

function onInspectorPanelContextMenu(ev: MouseEvent): void {
  const t = ev.target;
  if (t instanceof Element) {
    if (t.closest("input, textarea, select") || t.closest('[contenteditable="true"]')) {
      return;
    }
  }
  ev.preventDefault();

  const sel = props.selectedEid;
  const snap = props.snapshot;

  const addChildren: ContextMenuItem[] =
    sel !== null && snap
      ? missingComponents.value.length === 0
        ? [{ id: "add-none", label: "All components added", disabled: true, onSelect: () => {} }]
        : missingComponents.value.map((name) => ({
            id: `add-${name}`,
            label: name,
            onSelect: () => {
              emit("addComponent", name);
            },
          }))
      : [{ id: "add-need-entity", label: "Select an entity first", disabled: true, onSelect: () => {} }];

  const panelItems: ContextMenuEntry[] = [
    {
      id: "add-submenu",
      label: "Add",
      disabled: sel === null || !snap,
      children: addChildren,
    },
    {
      id: "paste-components",
      label: "Paste",
      shortcut: "Ctrl+V",
      disabled: sel === null,
      onSelect: () => {
        emit("pasteComponents");
      },
    },
  ];
  open(ev.clientX, ev.clientY, panelItems);
}

function onComponentRowContextMenu(ev: MouseEvent, componentName: string): void {
  const rowItems: ContextMenuItem[] = [
    {
      id: "copy-component",
      label: "Copy",
      shortcut: "Ctrl+C",
      onSelect: () => {
        emit("copyComponent", componentName);
      },
    },
    {
      id: "remove-component",
      label: "Remove",
      danger: true,
      onSelect: () => {
        emit("removeComponent", componentName);
      },
    },
  ];
  open(ev.clientX, ev.clientY, rowItems);
}
</script>

<style scoped>
.inspector {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.inspector__header {
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #bbb;
  border-bottom: 1px solid #333;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
.inspector__devToggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 500;
  color: #888;
  cursor: pointer;
  user-select: none;
}
.inspector__devToggle input {
  cursor: pointer;
}
.inspector__empty {
  padding: 12px 10px;
  font-size: 12px;
  color: #777;
}
.inspector__body {
  overflow: auto;
  flex: 1;
  padding: 8px 10px 12px;
}
.inspector__component {
  margin-bottom: 14px;
}
.inspector__comp-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 0 0 8px;
}
.inspector__comp-title {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  color: #9cf;
  text-transform: none;
}
.inspector__comp-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.inspector__rawBtn {
  padding: 2px 8px;
  font-size: 10px;
  color: #ccc;
  background: #222;
  border: 1px solid #555;
  border-radius: 2px;
  cursor: pointer;
}
.inspector__rawBtn:hover {
  border-color: #6af;
  color: #fff;
}
</style>

<style>
/* Unscoped: child inspector SFCs use these class names from the previous monolithic panel. */
.inspector__field {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 6px;
  align-items: center;
  margin-bottom: 6px;
  font-size: 11px;
}
.inspector__label {
  color: #888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  user-select: none;
}
.inspector__label--draggable {
  cursor: ew-resize;
}
.inspector__input {
  width: 100%;
  box-sizing: border-box;
  padding: 4px 6px;
  font-size: 11px;
  font-family: ui-monospace, monospace;
  color: #eee;
  background: #111;
  border: 1px solid #444;
  border-radius: 2px;
}
.inspector__input:focus {
  outline: none;
  border-color: #6af;
}
.inspector__readonly {
  padding: 4px 2px;
  color: #aaa;
  font-family: ui-monospace, monospace;
  word-break: break-word;
}
</style>
