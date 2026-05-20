<template>

  <div v-show="visible" class="astris-cockpit">

    <div class="astris-cockpit__vignette" aria-hidden="true" />



    <aside class="astris-cockpit__palette astris-cockpit__palette--left" aria-label="Кисти и базовые паттерны">

      <div class="astris-cockpit__paletteGroup">

        <span class="astris-cockpit__paletteLabel">Tools</span>

        <AstrisBrushTooltip :info="GOL_TOOL_TOOLTIPS.paint" placement="right">

          <button

            type="button"

            class="astris-cockpit__brush"

            data-game-ui-interactive

            :class="{ 'astris-cockpit__brush--active': toolMode === 'paint' && !armedPresetId }"

            @click="setTool('paint')"

          >

            <GolPatternPreviewSvg kind="paint" />

            <span class="astris-cockpit__brushCaption">Paint</span>

          </button>

        </AstrisBrushTooltip>

        <AstrisBrushTooltip :info="GOL_TOOL_TOOLTIPS.erase" placement="right">

          <button

            type="button"

            class="astris-cockpit__brush"

            data-game-ui-interactive

            :class="{ 'astris-cockpit__brush--active': toolMode === 'erase' && !armedPresetId }"

            @click="setTool('erase')"

          >

            <GolPatternPreviewSvg kind="erase" />

            <span class="astris-cockpit__brushCaption">Erase</span>

          </button>

        </AstrisBrushTooltip>

      </div>



      <div class="astris-cockpit__paletteGroup">

        <span class="astris-cockpit__paletteLabel">Classic</span>

        <AstrisBrushTooltip

          v-for="id in basicPresetIds"

          :key="id"

          :info="GOL_PRESET_TOOLTIPS[id]"

          placement="right"

          :armed-hint="armedPresetId === id ? 'Выбрано — клик для установки · кнопка ещё раз — снять' : 'Клик по сетке для установки'"

        >

          <button

            type="button"

            class="astris-cockpit__brush"

            data-game-ui-interactive

            :class="{ 'astris-cockpit__brush--active': armedPresetId === id }"

            @click="onPresetArm(id)"

          >

            <GolPatternPreviewSvg kind="preset" :preset-id="id" />

            <span class="astris-cockpit__brushCaption">{{ GOL_PRESET_LABELS[id] }}</span>

          </button>

        </AstrisBrushTooltip>

      </div>

    </aside>



    <aside class="astris-cockpit__palette astris-cockpit__palette--right" aria-label="Сложные паттерны">

      <div class="astris-cockpit__paletteGroup">

        <span class="astris-cockpit__paletteLabel">Complex</span>

        <AstrisBrushTooltip

          v-for="id in advancedPresetIds"

          :key="id"

          :info="GOL_PRESET_TOOLTIPS[id]"

          placement="left"

          :armed-hint="armedPresetId === id ? 'Выбрано — клик для установки · кнопка ещё раз — снять' : 'Клик по сетке · нужно много места'"

        >

          <button

            type="button"

            class="astris-cockpit__brush astris-cockpit__brush--complex"

            data-game-ui-interactive

            :class="{ 'astris-cockpit__brush--active': armedPresetId === id }"

            @click="onPresetArm(id)"

          >

            <GolPatternPreviewSvg kind="preset" :preset-id="id" />

            <span class="astris-cockpit__brushCaption">{{ GOL_PRESET_LABELS[id] }}</span>

          </button>

        </AstrisBrushTooltip>

      </div>

    </aside>



    <header class="astris-cockpit__top">

      <div class="astris-cockpit__brand">

        <h1 class="astris-cockpit__title">Astris</h1>

        <p class="astris-cockpit__subtitle">Conway · Life</p>

      </div>

      <div class="astris-cockpit__metrics">

        <span class="astris-cockpit__chip" :class="statusClass">{{ statusLabel }}</span>

        <span class="astris-cockpit__stat">

          Gen <strong>{{ generation }}</strong>

        </span>

        <span class="astris-cockpit__stat">

          Cells <strong>{{ aliveCount }}</strong>

        </span>

      </div>

    </header>



    <footer class="astris-cockpit__dock">

      <div class="astris-cockpit__toolbar">

        <button

          type="button"

          class="astris-cockpit__btn astris-cockpit__btn--primary"

          data-game-ui-interactive

          :title="playSessionActive ? 'Остановить Play' : 'Enter Play'"

          @click="onPlayToggle"

        >

          <AstrisGameIcon :kind="playSessionActive ? 'stop' : 'play'" :size="14" />

          {{ playSessionActive ? "Stop" : "Play" }}

        </button>

        <button

          type="button"

          class="astris-cockpit__btn"

          data-game-ui-interactive

          :disabled="!playSessionActive"

          :class="{ 'astris-cockpit__btn--active': simulationPaused }"

          :title="pauseTitle"

          @click="onPauseClick"

        >

          <AstrisGameIcon :kind="simulationPaused ? 'play' : 'pause'" :size="14" />

          {{ simulationPaused ? "Resume" : "Pause" }}

        </button>



        <button

          type="button"

          class="astris-cockpit__btn astris-cockpit__btn--danger"

          data-game-ui-interactive

          title="Удалить все клетки"

          @click="onClear"

        >

          <AstrisGameIcon kind="trash" :size="14" />

          Clear

        </button>

      </div>



      <div class="astris-cockpit__hints">

        <button

          type="button"

          class="astris-cockpit__hintsToggle"

          data-game-ui-interactive

          :aria-expanded="hintsOpen"

          @click="hintsOpen = !hintsOpen"

        >

          <AstrisGameIcon kind="chevron" :size="14" :expanded="hintsOpen" />

          Управление

        </button>

        <ul v-show="hintsOpen" class="astris-cockpit__hintsBody">

          <li>WASD — полёт · ПКМ — обзор · наведение — превью клеток</li>

          <li>Слева — кисти и классика · справа — сложные · паттерн остаётся выбранным</li>

          <li>Play — симуляция · Pause — шаги на паузе</li>

        </ul>

      </div>

    </footer>

  </div>

</template>



<script setup lang="ts">

import { computed, onMounted, onUnmounted, ref } from "vue";

import type { EditorShellActiveView, EngineAPI } from "@merlinn/helios-core";

import type { PlayModeController } from "@merlinn/helios-editor";

import {

    ASTRIS_GOL_ARMED_PRESET_CAPABILITY,

    ASTRIS_GOL_STATS_CAPABILITY,

    ASTRIS_GOL_TOOL_CAPABILITY,

    type GolArmedPresetState,

    type GolPresetId,

    type GolStatsState,

    type GolToolMode,

    type GolToolState,

} from "../game/astrisCapabilities";

import { clearAllLifeCells } from "../game/clearLifeCells";

import {

    GOL_ADVANCED_PRESET_IDS,

    GOL_BASIC_PRESET_IDS,

    GOL_PRESET_LABELS,

    GOL_PRESET_TOOLTIPS,

    GOL_TOOL_TOOLTIPS,

} from "../game/golPresets";

import AstrisBrushTooltip from "./AstrisBrushTooltip.vue";

import AstrisGameIcon from "./AstrisGameIcon.vue";

import GolPatternPreviewSvg from "./GolPatternPreviewSvg.vue";

import { useAstrisGameState } from "./useAstrisGameState";



const props = defineProps<{

  engineApi: EngineAPI;

  playMode: PlayModeController;

  getActiveView: () => EditorShellActiveView;

  subscribeActiveView: (listener: (view: EditorShellActiveView) => void) => () => void;

}>();



const basicPresetIds = GOL_BASIC_PRESET_IDS;

const advancedPresetIds = GOL_ADVANCED_PRESET_IDS;



const hintsOpen = ref(false);

const armedPresetId = ref<GolPresetId | null>(null);



const {

  visible,

  playSessionActive,

  simulationPaused,

  toolMode,

  generation,

  aliveCount,

  statusLabel,

  statusClass,

} = useAstrisGameState(props);



const pauseTitle = computed(() =>

  !playSessionActive.value

    ? "Доступно после Play"

    : simulationPaused.value

      ? "Возобновить симуляцию"

      : "Пауза симуляции",

);



function syncArmedPreset(): void {

  armedPresetId.value =

    props.engineApi.getCapability<GolArmedPresetState>(ASTRIS_GOL_ARMED_PRESET_CAPABILITY)?.presetId ?? null;

}



function clearArmedPreset(): void {

  const armed = props.engineApi.getCapability<GolArmedPresetState>(ASTRIS_GOL_ARMED_PRESET_CAPABILITY);

  if (armed) {

    armed.presetId = null;

  }

  armedPresetId.value = null;

}



function setTool(mode: GolToolMode): void {

  const tool = props.engineApi.getCapability<GolToolState>(ASTRIS_GOL_TOOL_CAPABILITY);

  if (tool) {

    tool.mode = mode;

  }

  toolMode.value = mode;

  clearArmedPreset();

}



async function onPlayToggle(): Promise<void> {

  await props.playMode.togglePlay();

  playSessionActive.value = props.playMode.isPlaying;

}



function onPauseClick(): void {

  props.engineApi.toggleSimulationPaused();

  simulationPaused.value = props.engineApi.isSimulationPaused();

}



function onClear(): void {

  const stats = props.engineApi.getCapability<GolStatsState>(ASTRIS_GOL_STATS_CAPABILITY);

  clearAllLifeCells(props.engineApi, stats);

  aliveCount.value = 0;

  generation.value = 0;

}



function onPresetArm(presetId: GolPresetId): void {

  const armed = props.engineApi.getCapability<GolArmedPresetState>(ASTRIS_GOL_ARMED_PRESET_CAPABILITY);

  if (!armed) {

    return;

  }

  armed.presetId = armed.presetId === presetId ? null : presetId;

  syncArmedPreset();

}



let armedPoll: ReturnType<typeof setInterval> | undefined;



onMounted(() => {

  syncArmedPreset();

  armedPoll = setInterval(syncArmedPreset, 100);

});



onUnmounted(() => {

  if (armedPoll !== undefined) {

    clearInterval(armedPoll);

  }

});

</script>


