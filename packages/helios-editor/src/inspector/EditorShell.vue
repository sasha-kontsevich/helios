<template>
  <div class="shell">
    <aside class="shell__left">
      <div class="shell__leftTabs" role="tablist" aria-label="Левая панель">
        <button
          type="button"
          class="shell__leftTab"
          role="tab"
          :aria-selected="leftPanelTab === 'entities'"
          :class="{ 'shell__leftTab--active': leftPanelTab === 'entities' }"
          @click="leftPanelTab = 'entities'"
        >
          Entities
        </button>
        <button
          type="button"
          class="shell__leftTab"
          role="tab"
          :aria-selected="leftPanelTab === 'systems'"
          :class="{ 'shell__leftTab--active': leftPanelTab === 'systems' }"
          @click="leftPanelTab = 'systems'"
        >
          Systems
        </button>
      </div>
      <EntityListPanel
        v-show="leftPanelTab === 'entities'"
        :entities="entities"
        :selected-eid="selectedEid"
        @select="onSelect"
        @create="onCreateEntity"
        @create-primitive="onCreatePrimitiveEntity"
        @delete="onDeleteEntity"
        @copy="onCopyEntity"
        @paste="onPasteEntity"
      />
      <SystemListPanel
        v-show="leftPanelTab === 'systems'"
        :systems="systemSnapshots"
        @toggle-enabled="onToggleSystemEnabled"
      />
    </aside>
    <main class="shell__center">
      <div class="shell__centerInner">
        <div class="shell__tabStrip">
          <div class="shell__tabStripTabs" role="tablist" aria-label="Редактор или Игра">
            <button
              type="button"
              class="shell__windowTab"
              role="tab"
              :aria-selected="centerView === 'editor'"
              :class="{ 'shell__windowTab--active': centerView === 'editor' }"
              @click="setCenterView('editor')"
            >
              Редактор
            </button>
            <button
              type="button"
              class="shell__windowTab"
              role="tab"
              :aria-selected="centerView === 'game'"
              :class="{ 'shell__windowTab--active': centerView === 'game' }"
              @click="setCenterView('game')"
            >
              Игра
            </button>
          </div>
          <div class="shell__tabStripTransport" role="toolbar" aria-label="Воспроизведение сцены">
            <button
              type="button"
              class="shell__tabTransportBtn"
              :class="{ 'shell__tabTransportBtn--stop': playSessionActive }"
              :title="
                playSessionActive
                  ? 'Остановить воспроизведение и вернуть сцену редактора'
                  : 'Воспроизвести снимок сцены'
              "
              :aria-label="
                playSessionActive
                  ? 'Остановить воспроизведение и вернуть сцену редактора'
                  : 'Воспроизвести снимок сцены'
              "
              @click="onPlayToggle"
            >
              <TransformToolIcon :kind="playSessionActive ? 'stop' : 'play'" :size="CHROME_TAB_ICON_SIZE" />
            </button>
            <button
              v-if="gameSimulationCapabilityKey"
              type="button"
              class="shell__tabTransportBtn"
              :class="{ 'shell__tabTransportBtn--toggled': gamePausePressed }"
              :aria-pressed="gamePausePressed"
              :title="gamePauseTitle"
              :aria-label="gamePauseLabel"
              @click="onGamePauseClick"
            >
              <TransformToolIcon :kind="gamePausePressed ? 'play' : 'pause'" :size="CHROME_TAB_ICON_SIZE" />
            </button>
          </div>
          <div class="shell__tabStripFiller" aria-hidden="true" />
        </div>

        <div class="shell__viewportColumn">
      <div
        v-if="transformTools && centerView === 'editor'"
        class="shell__transformToolbar"
        role="toolbar"
        aria-label="Инструменты трансформации"
      >
        <button
          type="button"
          class="shell__toolBtn"
          :class="{ 'shell__toolBtn--active': transformMode === 'translate' }"
          title="Перенос (W)"
          aria-label="Перенос (W)"
          @click="setTransformMode('translate')"
        >
          <TransformToolIcon kind="move" />
        </button>
        <button
          type="button"
          class="shell__toolBtn"
          :class="{ 'shell__toolBtn--active': transformMode === 'rotate' }"
          title="Поворот (E)"
          aria-label="Поворот (E)"
          @click="setTransformMode('rotate')"
        >
          <TransformToolIcon kind="rotate" />
        </button>
        <button
          type="button"
          class="shell__toolBtn"
          :class="{ 'shell__toolBtn--active': transformMode === 'scale' }"
          title="Масштаб (R)"
          aria-label="Масштаб (R)"
          @click="setTransformMode('scale')"
        >
          <TransformToolIcon kind="scale" />
        </button>
        <button
          type="button"
          class="shell__toolBtn shell__toolBtn--gizmo"
          :class="{ 'shell__toolBtn--active': transformGizmoVisible }"
          title="Показать / скрыть гизмо (Q)"
          :aria-label="transformGizmoVisible ? 'Скрыть гизмо (Q)' : 'Показать гизмо (Q)'"
          @click="toggleTransformGizmo"
        >
          <TransformToolIcon :kind="transformGizmoVisible ? 'eye' : 'eye-off'" />
        </button>
      </div>
      <div
        v-show="centerView === 'editor'"
        class="shell__sceneHud"
        title="Свободная камера: orbit и полёт (ПКМ). Сущность с ThreeCamera: вид для предпросмотра, поза из ECS."
      >
        <label class="shell__cameraHudLabel">
          Камера
          <select
            class="shell__cameraHudSelect"
            :value="editorRenderCameraEid === null ? '' : String(editorRenderCameraEid)"
            @change="onEditorViewportCameraChange"
          >
            <option value="">Свободная</option>
            <option v-for="c in cameraEntities" :key="c.eid" :value="String(c.eid)">{{ entityDisplayLabel(c) }}</option>
          </select>
        </label>
      </div>
          <div class="shell__viewportWrap">
            <div v-show="centerView === 'editor'" class="shell__viewportPane">
              <canvas id="helios-editor-view" class="shell__canvas"></canvas>
            </div>
            <div
              v-show="centerView === 'game'"
              class="shell__viewportPane shell__viewportPane--game"
            >
              <canvas id="helios-game-view" class="shell__canvas shell__canvas--game"></canvas>
            </div>
          </div>
        </div>
      </div>
    </main>
    <aside class="shell__right">
      <InspectorPanel
        :selected-eid="selectedEid"
        :snapshot="inspectorSnapshot"
        :available-components="availableComponents"
        :inspector-registry="inspectorRegistry"
        @apply-patch="onApplyPatch"
        @editing-changed="onEditingChanged"
        @add-component="onAddComponent"
        @remove-component="onRemoveComponent"
        @copy-component="onCopyComponent"
        @paste-components="onPasteComponents"
      />
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from "vue";
import {
  EDITOR_SHELL_ACTIVE_VIEW_CAPABILITY,
  type ComponentMap,
  type EditorShellActiveViewState,
  type EngineAPI,
  type EntitySnapshot,
  type SystemRuntimeSnapshot,
} from "@merlinn/helios-core";
import type { GameSimulationControls } from "../gameSimulationControls";
import type { PlayModeController } from "../play/PlayModeController";
import type { ITransformToolController, TransformToolMode } from "../manipulators/ITransformToolController";
import type { ISelectionBus } from "../selection/SelectionBus";
import type { EditorInspectorRegistry } from "./registry/EditorInspectorRegistry";
import EntityListPanel from "./EntityListPanel.vue";
import SystemListPanel from "./SystemListPanel.vue";
import InspectorPanel from "./InspectorPanel.vue";
import TransformToolIcon from "./TransformToolIcon.vue";
import {
  defaultEditorPrimitiveComponents,
  type EditorPrimitiveKind,
} from "../presets/defaultEditorPrimitiveComponents";
import {
  readEditorEntityClipboardJson,
  tryParseEditorEntityClipboardJson,
  writeEditorEntityClipboard,
} from "./editorEntityClipboardBridge";
import { entityDisplayLabel } from "../utils/entityDisplayLabel";
import type { EditorViewportInteractionController } from "../viewport/EditorViewportInteractionMode";

const REFRESH_MS = 160;

/** Pixels; mirrors `--helios-chrome-tab-icon-size` in `ui/heliosChrome.css`. */
const CHROME_TAB_ICON_SIZE = 13;

const props = defineProps<{
  engineApi: EngineAPI;
  selection: ISelectionBus;
  transformTools?: ITransformToolController | null;
  inspectorRegistry: EditorInspectorRegistry;
  viewportInteraction?: EditorViewportInteractionController | null;
  gameSimulationCapabilityKey?: string | null;
  playMode: PlayModeController;
}>();

const pauseUiTick = ref(0);
/** Unity-like Play Mode: snapshot run / restore (see {@link PlayModeController}). */
const playSessionActive = ref(false);
const centerView = ref<"editor" | "game">("editor");
const leftPanelTab = ref<"entities" | "systems">("entities");

const entities = shallowRef<EntitySnapshot[]>([]);
const systemSnapshots = shallowRef<SystemRuntimeSnapshot[]>([]);
const selectedEid = ref<number | null>(null);
const transformMode = ref<TransformToolMode>("translate");
const transformGizmoVisible = ref(true);
/** ECS entity id for editor viewport camera, or `null` for the free orbit camera. */
const editorRenderCameraEid = ref<number | null>(null);

const cameraEntities = computed(() =>
  entities.value.filter((e) => Object.prototype.hasOwnProperty.call(e.components, "ThreeCamera")),
);

const inspectorSnapshot = ref<EntitySnapshot | null>(null);
const inspectorEditing = ref(false);
const availableComponents = ref<string[]>([]);

let pollTimer: ReturnType<typeof setInterval> | undefined;
let selectionUnsub: (() => void) | undefined;
let transformToolUnsub: (() => void) | undefined;

function syncTransformToolbar(): void {
  const t = props.transformTools;
  if (!t) {
    return;
  }
  transformMode.value = t.getMode();
  transformGizmoVisible.value = t.getGizmoUiVisible();
}

function setTransformMode(mode: TransformToolMode): void {
  props.transformTools?.setMode(mode);
}

function toggleTransformGizmo(): void {
  const t = props.transformTools;
  if (!t) {
    return;
  }
  t.setGizmoUiVisible(!t.getGizmoUiVisible());
}

/** Драйвер {@link RenderSystem}: какой GPU-проход крутить этот кадр. */
function syncShellActiveViewCapability(): void {
  const st = props.engineApi.getCapability<EditorShellActiveViewState>(
    EDITOR_SHELL_ACTIVE_VIEW_CAPABILITY,
  );
  if (!st) {
    return;
  }
  st.activeView = centerView.value === "game" ? "game" : "editor";
}

function setCenterView(mode: "editor" | "game"): void {
  centerView.value = mode;
  props.viewportInteraction?.setMode(mode);
  syncShellActiveViewCapability();
}

const gameSimulationControls = computed(() => {
  const key = props.gameSimulationCapabilityKey;
  if (!key) {
    return null;
  }
  return props.engineApi.getCapability<GameSimulationControls>(key) ?? null;
});

const gamePauseLabel = computed(() => {
  void pauseUiTick.value;
  return gameSimulationControls.value?.paused ? "Продолжить" : "Пауза";
});

const gamePauseTitle = computed(() =>
  gameSimulationControls.value?.paused
    ? "Возобновить шаги симуляции"
    : "Приостановить шаги симуляции",
);

const gamePausePressed = computed(() => {
  void pauseUiTick.value;
  return gameSimulationControls.value?.paused ?? false;
});

function onGamePauseClick(): void {
  gameSimulationControls.value?.togglePause();
  pauseUiTick.value += 1;
}

async function onPlayToggle(): Promise<void> {
  await props.playMode.togglePlay();
  playSessionActive.value = props.playMode.isPlaying;
  await nextTick();
  refreshEntityList();
  refreshSystemList();
  selectedEid.value = null;
  props.selection.set(null);
  refreshInspector();
}

function sortEntities(list: EntitySnapshot[]): EntitySnapshot[] {
  return [...list].sort((a, b) => a.eid - b.eid);
}

function refreshSystemList(): void {
  systemSnapshots.value = props.engineApi.listSystemRuntimeSnapshots();
}

async function onToggleSystemEnabled(name: string, enabled: boolean): Promise<void> {
  try {
    await props.engineApi.setSystemEnabled(name, enabled);
  } catch (err) {
    console.error("[HeliosEditor] setSystemEnabled failed:", err);
  }
  refreshSystemList();
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
  syncEditorViewportCameraFromWorld();
}

function syncEditorViewportCameraFromWorld(): void {
  const apiEid = props.engineApi.getEditorRenderCameraEid();
  if (apiEid !== null) {
    const still = entities.value.some(
      (e) => e.eid === apiEid && Object.prototype.hasOwnProperty.call(e.components, "ThreeCamera"),
    );
    if (!still) {
      props.engineApi.setEditorRenderCameraEid(null);
    }
  }
  editorRenderCameraEid.value = props.engineApi.getEditorRenderCameraEid();
}

function onEditorViewportCameraChange(ev: Event): void {
  const v = (ev.target as HTMLSelectElement).value;
  const eid = v === "" ? null : Number(v);
  editorRenderCameraEid.value = eid;
  props.engineApi.setEditorRenderCameraEid(eid);
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
  props.selection.set(eid);
  refreshInspector();
}

function onCreateEntity(): void {
  const eid = props.engineApi.createEntityFromComponents({
    Name: { label: "Новая сущность" },
  });
  refreshEntityList();
  selectedEid.value = eid;
  props.selection.set(eid);
  refreshInspector();
}

function onCreatePrimitiveEntity(kind: EditorPrimitiveKind): void {
  const eid = props.engineApi.createEntityFromComponents(defaultEditorPrimitiveComponents(kind));
  refreshEntityList();
  selectedEid.value = eid;
  props.selection.set(eid);
  refreshInspector();
}

function onDeleteEntity(eid: number): void {
  if (props.engineApi.getEditorRenderCameraEid() === eid) {
    props.engineApi.setEditorRenderCameraEid(null);
    editorRenderCameraEid.value = null;
  }
  props.engineApi.deleteEntity(eid);
  if (selectedEid.value === eid) {
    selectedEid.value = null;
    props.selection.set(null);
    inspectorSnapshot.value = null;
  }
  refreshEntityList();
}

function isTextInputTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = (target as HTMLInputElement).type;
    if (
      type === "checkbox" ||
      type === "radio" ||
      type === "range" ||
      type === "file" ||
      type === "button" ||
      type === "submit" ||
      type === "reset"
    ) {
      return false;
    }
    return true;
  }
  return false;
}

async function copyEntityToClipboard(eid: number): Promise<void> {
  const json = props.engineApi.serializeEditorEntityClipboard(eid);
  await writeEditorEntityClipboard(json);
}

async function pasteEntityFromClipboard(): Promise<void> {
  const raw = await readEditorEntityClipboardJson();
  const parsed = tryParseEditorEntityClipboardJson(raw);
  if (!parsed) {
    console.warn("[HeliosEditor] Paste: clipboard is empty or not a Helios entity payload.");
    return;
  }
  const newEid = props.engineApi.createEntityFromEditorClipboardPayload(parsed);
  refreshEntityList();
  selectedEid.value = newEid;
  props.selection.set(newEid);
  refreshInspector();
}

function onCopyEntity(eid: number): void {
  void copyEntityToClipboard(eid);
}

function onPasteEntity(): void {
  void pasteEntityFromClipboard();
}

function onGlobalKeydown(ev: KeyboardEvent): void {
  const mod = ev.ctrlKey || ev.metaKey;
  if (!mod) return;
  if (isTextInputTarget(ev.target)) return;

  if (ev.key === "c" || ev.key === "C") {
    if (selectedEid.value === null) return;
    ev.preventDefault();
    void copyEntityToClipboard(selectedEid.value);
  } else if (ev.key === "v" || ev.key === "V") {
    ev.preventDefault();
    void pasteEntityFromClipboard();
  }
}

function onApplyPatch(payload: { componentName: string; patch: Record<string, unknown> }): void {
  const id = selectedEid.value;
  if (id === null) return;
  props.engineApi.applyComponentPatch(id, payload.componentName as keyof ComponentMap, payload.patch);
  // Avoid fighting the user's input. Snapshot will refresh via polling when not editing.
}

function onAddComponent(componentName: string): void {
  const id = selectedEid.value;
  if (id === null) return;
  props.engineApi.addComponent(id, componentName as keyof ComponentMap);
  if (componentName === "Scale" && props.engineApi.hasComponent(id, "Scale" as keyof ComponentMap)) {
    props.engineApi.applyComponentPatch(id, "Scale" as keyof ComponentMap, { x: 1, y: 1, z: 1 });
  }
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

async function onCopyComponent(componentName: string): Promise<void> {
  const id = selectedEid.value;
  if (id === null) return;
  try {
    const json = props.engineApi.serializeEditorComponentClipboard(id, componentName);
    await writeEditorEntityClipboard(json);
  } catch (e) {
    console.warn("[HeliosEditor] Copy component:", e);
  }
}

async function onPasteComponents(): Promise<void> {
  const id = selectedEid.value;
  if (id === null) return;
  const raw = await readEditorEntityClipboardJson();
  const parsed = tryParseEditorEntityClipboardJson(raw);
  if (!parsed) {
    console.warn("[HeliosEditor] Paste components: clipboard is empty or invalid.");
    return;
  }
  try {
    props.engineApi.mergeEntityFromEditorClipboardPayload(id, parsed);
  } catch (e) {
    console.warn("[HeliosEditor] Paste components:", e);
    return;
  }
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
  if (props.viewportInteraction) {
    centerView.value = props.viewportInteraction.getMode();
  }
  syncShellActiveViewCapability();
  refreshEntityList();
  refreshSystemList();
  editorRenderCameraEid.value = props.engineApi.getEditorRenderCameraEid();
  refreshInspector();
  selectionUnsub = props.selection.subscribe((eid) => {
    selectedEid.value = eid;
  });
  const tt = props.transformTools;
  if (tt) {
    syncTransformToolbar();
    transformToolUnsub = tt.subscribe(() => {
      syncTransformToolbar();
    });
  }
  window.addEventListener("keydown", onGlobalKeydown);
  pollTimer = setInterval(() => {
    syncShellActiveViewCapability();
    refreshEntityList();
    refreshSystemList();
    if (!inspectorEditing.value) {
      refreshInspector();
    }
  }, REFRESH_MS);
});

onUnmounted(() => {
  selectionUnsub?.();
  selectionUnsub = undefined;
  transformToolUnsub?.();
  transformToolUnsub = undefined;
  window.removeEventListener("keydown", onGlobalKeydown);
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
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial,
    "Noto Sans", "Liberation Sans", sans-serif;
}
.shell__left {
  width: 240px;
  flex-shrink: 0;
  border-right: 1px solid #333;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.shell__leftTabs {
  flex-shrink: 0;
  display: flex;
  align-items: stretch;
  height: var(--helios-chrome-row-height);
  gap: 0;
  padding: 0;
  border-bottom: 1px solid #333;
  background: #252525;
}
.shell__leftTab {
  flex: 1;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 var(--helios-chrome-row-pad-x);
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  background: transparent;
  color: #9ca3af;
  font-size: var(--helios-chrome-tab-font-size);
  font-weight: 500;
  cursor: pointer;
  user-select: none;
}
.shell__leftTab:hover {
  color: #e5e7eb;
}
.shell__leftTab--active {
  color: #f3f4f6;
  border-bottom-color: #5a8ab8;
}
.shell__left > .entity-list,
.shell__left > .system-list {
  flex: 1;
  min-height: 0;
}
.shell__center {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #222;
}
.shell__centerInner {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.shell__tabStrip {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: end;
  column-gap: 6px;
  min-height: var(--helios-chrome-row-height);
  padding: 0 4px;
  background: #2a2a2a;
  border-bottom: 1px solid #3d3d3d;
}
.shell__tabStripTabs {
  grid-column: 1;
  display: flex;
  align-items: flex-end;
  justify-self: start;
  gap: 0;
}
.shell__tabStripTransport {
  grid-column: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  align-self: center;
}
.shell__tabStripFiller {
  grid-column: 3;
  min-width: 0;
}
.shell__windowTab {
  position: relative;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  margin: 0;
  min-height: var(--helios-chrome-row-height);
  padding: 0 11px;
  border: 1px solid transparent;
  border-bottom: none;
  border-radius: 6px 6px 0 0;
  background: #232323;
  color: #9ca3af;
  font-size: var(--helios-chrome-tab-font-size);
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  margin-bottom: -1px;
}
.shell__windowTab:hover {
  color: #e5e7eb;
  background: #2e2e2e;
}
.shell__windowTab--active {
  z-index: 1;
  background: #222;
  color: #f3f4f6;
  border-color: #3d3d3d;
  border-bottom-color: #222;
  box-shadow: 0 -1px 0 rgba(255, 255, 255, 0.04) inset;
}
.shell__tabTransportBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--helios-chrome-icon-hit);
  height: var(--helios-chrome-icon-hit);
  padding: 0;
  border-radius: 4px;
  border: 1px solid #4b5563;
  background: #2a3038;
  color: #b8c9e0;
  cursor: pointer;
  user-select: none;
}
.shell__tabTransportBtn:hover {
  background: #374151;
  color: #f1f5f9;
  border-color: #64748b;
}
.shell__tabTransportBtn--stop {
  background: #3f1f1f;
  border-color: #924949;
  color: #fecaca;
}
.shell__tabTransportBtn--stop:hover {
  background: #522626;
  color: #fff;
  border-color: #b85555;
}
.shell__tabTransportBtn--toggled {
  background: #3a3524;
  border-color: #78703a;
  color: #fde68a;
}
.shell__viewportColumn {
  flex: 1;
  position: relative;
  min-height: 0;
  background: #222;
}
.shell__transformToolbar {
  position: absolute;
  top: 10px;
  left: 8px;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--helios-overlay-toolbar-gap);
  padding: var(--helios-overlay-toolbar-pad-y) var(--helios-overlay-toolbar-pad-x);
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid #444;
  pointer-events: auto;
}
.shell__toolBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--helios-overlay-control-height);
  height: var(--helios-overlay-control-height);
  padding: 0 6px;
  border-radius: 3px;
  border: 1px solid #555;
  background: #2a2a2a;
  color: #c8c8c8;
  font-size: 12px;
  cursor: pointer;
  user-select: none;
}
.shell__toolBtn:hover {
  background: #353535;
  color: #eee;
}
.shell__toolBtn--active {
  background: #1e4a6e;
  border-color: #3a7ab0;
  color: #e8f4ff;
}
.shell__toolBtn--gizmo.shell__toolBtn--active {
  background: #2d4a2d;
  border-color: #4a8a4a;
  color: #e0ffe0;
}
.shell__sceneHud {
  position: absolute;
  top: 10px;
  right: 8px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 6px;
  box-sizing: border-box;
  min-height: var(--helios-overlay-control-height);
  padding: 0 8px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid #444;
  font-size: 12px;
  color: #ccc;
  pointer-events: auto;
}
.shell__cameraHudLabel {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  cursor: default;
  user-select: none;
}
.shell__cameraHudSelect {
  min-width: 120px;
  max-width: 200px;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid #555;
  background: #2a2a2a;
  color: #e8e8e8;
  font-size: 12px;
}
.shell__viewportWrap {
  position: absolute;
  inset: 0;
  min-height: 0;
}
.shell__viewportPane {
  position: absolute;
  inset: 0;
  min-width: 0;
  min-height: 0;
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
