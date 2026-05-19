<template>
  <div v-show="visible" class="astrisHud">
    <div class="astrisHud__row">
      <button
        type="button"
        class="astrisHud__pauseBtn"
        data-game-ui-interactive
        :disabled="!playSessionActive"
        :aria-pressed="simulationPaused"
        :title="pauseButtonTitle"
        @click="onPauseClick"
      >
        {{ simulationPaused ? "Продолжить" : "Пауза" }}
      </button>
      <p class="astrisHud__stat">Cells: {{ aliveCount }}</p>
    </div>
    <div class="astrisHud__hints">
      <p>WASD — fly · ПКМ — look · ЛКМ — клетка · зажатый ЛКМ — рисовать</p>
      <p>▶ Play — вкладка сверху; пауза симуляции — кнопка выше (после Enter Play)</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef } from "vue";
import type { EditorShellActiveView, EngineAPI } from "@merlinn/helios-core";
import type { PlayModeController } from "@merlinn/helios-editor";

const props = defineProps<{
  engineApi: EngineAPI;
  playMode: PlayModeController;
  getActiveView: () => EditorShellActiveView;
  subscribeActiveView: (listener: (view: EditorShellActiveView) => void) => () => void;
}>();

const visible = ref(props.getActiveView() === "game");
const aliveCount = shallowRef(0);
const simulationPaused = ref(props.engineApi.isSimulationPaused());
const playSessionActive = ref(props.playMode.isPlaying);

const pauseButtonTitle = computed(() => {
  if (!playSessionActive.value) {
    return "Сначала нажмите Play во вкладке редактора";
  }
  return simulationPaused.value
    ? "Возобновить шаги симуляции"
    : "Приостановить шаги симуляции";
});

function onPauseClick(): void {
  props.engineApi.toggleSimulationPaused();
  simulationPaused.value = props.engineApi.isSimulationPaused();
}

let pollTimer: ReturnType<typeof setInterval> | undefined;
let unsubActiveView: (() => void) | undefined;

function refreshStats(): void {
  let count = 0;
  for (const snap of props.engineApi.getAllEntities()) {
    if (Object.prototype.hasOwnProperty.call(snap.components, "LifeCell")) {
      count++;
    }
  }
  aliveCount.value = count;
  simulationPaused.value = props.engineApi.isSimulationPaused();
  playSessionActive.value = props.playMode.isPlaying;
}

onMounted(() => {
  unsubActiveView = props.subscribeActiveView((view) => {
    visible.value = view === "game";
  });
  refreshStats();
  pollTimer = setInterval(refreshStats, 100);
});

onUnmounted(() => {
  unsubActiveView?.();
  if (pollTimer !== undefined) {
    clearInterval(pollTimer);
  }
});
</script>

<style scoped>
.astrisHud {
  position: absolute;
  left: 12px;
  bottom: 12px;
  max-width: min(420px, calc(100% - 24px));
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(12, 14, 18, 0.72);
  color: #e8e8e8;
  font-size: 12px;
  line-height: 1.45;
  pointer-events: none;
}
.astrisHud__row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.astrisHud__pauseBtn {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(40, 48, 60, 0.9);
  color: #e8e8e8;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  pointer-events: auto;
}
.astrisHud__pauseBtn:hover:not(:disabled) {
  background: rgba(55, 65, 80, 0.95);
}
.astrisHud__pauseBtn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.astrisHud__pauseBtn[aria-pressed="true"] {
  border-color: rgba(220, 150, 60, 0.55);
  background: rgba(200, 120, 40, 0.35);
}
.astrisHud__stat {
  margin: 0;
  font-variant-numeric: tabular-nums;
}
.astrisHud__hints {
  margin: 0;
  opacity: 0.85;
  pointer-events: none;
}
.astrisHud__hints p {
  margin: 0 0 4px;
}
.astrisHud__hints p:last-child {
  margin-bottom: 0;
}
</style>
