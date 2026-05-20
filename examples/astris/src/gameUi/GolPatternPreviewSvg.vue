<template>
  <svg
    class="gol-pattern-preview"
    :viewBox="viewBox"
    preserveAspectRatio="xMidYMid meet"
    aria-hidden="true"
  >
    <defs>
      <linearGradient :id="`${uid}-cell`" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" :stop-color="accentBright" />
        <stop offset="100%" :stop-color="accent" />
      </linearGradient>
      <linearGradient :id="`${uid}-erase`" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffb0b0" />
        <stop offset="100%" stop-color="#e85d5d" />
      </linearGradient>
    </defs>

    <template v-if="kind === 'paint'">
      <rect
        v-for="cell in paintGrid"
        :key="`g-${cell.x}-${cell.y}`"
        :x="cell.x"
        :y="cell.y"
        width="0.92"
        height="0.92"
        rx="0.14"
        class="gol-pattern-preview__ghost"
      />
      <rect
        :x="paintCenter.x"
        :y="paintCenter.y"
        width="0.92"
        height="0.92"
        rx="0.14"
        class="gol-pattern-preview__cell"
        :fill="`url(#${uid}-cell)`"
      />
    </template>

    <template v-else-if="kind === 'erase'">
      <rect
        v-for="cell in eraseGrid"
        :key="`g-${cell.x}-${cell.y}`"
        :x="cell.x"
        :y="cell.y"
        width="0.92"
        height="0.92"
        rx="0.14"
        class="gol-pattern-preview__ghost"
      />
      <rect
        v-for="cell in eraseFilled"
        :key="`f-${cell.x}-${cell.y}`"
        :x="cell.x"
        :y="cell.y"
        width="0.92"
        height="0.92"
        rx="0.14"
        class="gol-pattern-preview__cell gol-pattern-preview__cell--dim"
        :fill="`url(#${uid}-cell)`"
      />
      <rect
        :x="eraseCenter.x"
        :y="eraseCenter.y"
        width="0.92"
        height="0.92"
        rx="0.14"
        class="gol-pattern-preview__cell gol-pattern-preview__cell--target"
        :fill="`url(#${uid}-erase)`"
      />
    </template>

    <template v-else>
      <rect
        v-for="(cell, i) in presetCells"
        :key="`p-${i}`"
        :x="cell.x"
        :y="cell.y"
        :width="cellSize"
        :height="cellSize"
        :rx="cellRadius"
        class="gol-pattern-preview__cell"
        :fill="`url(#${uid}-cell)`"
      />
    </template>
  </svg>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { GolPresetId } from "../game/golPresets";
import { getPresetOffsets } from "../game/golPresets";

const props = defineProps<{
  kind?: "preset" | "paint" | "erase";
  presetId?: GolPresetId;
}>();

const uid = `gol-preview-${Math.random().toString(36).slice(2, 9)}`;

const accent = "#44aa88";
const accentBright = "#5fd4a8";

const kind = computed(() => props.kind ?? (props.presetId ? "preset" : "paint"));

const cellSize = 0.88;
const cellRadius = 0.14;

function presetLayout(presetId: GolPresetId): {
  cells: { x: number; y: number }[];
  viewBox: string;
} {
  const offsets = getPresetOffsets(presetId);
  let minGx = 0;
  let maxGx = 0;
  let minGz = 0;
  let maxGz = 0;
  for (const [gx, gz] of offsets) {
    minGx = Math.min(minGx, gx);
    maxGx = Math.max(maxGx, gx);
    minGz = Math.min(minGz, gz);
    maxGz = Math.max(maxGz, gz);
  }
  const pad = 0.5;
  const w = maxGx - minGx + 1;
  const h = maxGz - minGz + 1;
  const side = Math.max(w, h, 3) + pad * 2;
  const cx = (side - w) / 2;
  const cy = (side - h) / 2;
  const cells = offsets.map(([gx, gz]) => ({
    x: gx - minGx + cx,
    y: gz - minGz + cy,
  }));
  return { cells, viewBox: `0 0 ${side} ${side}` };
}

const presetCells = computed(() => {
  if (kind.value !== "preset" || !props.presetId) {
    return [];
  }
  return presetLayout(props.presetId).cells;
});

const viewBox = computed(() => {
  if (kind.value === "paint" || kind.value === "erase") {
    return "0 0 5 5";
  }
  if (!props.presetId) {
    return "0 0 4 4";
  }
  return presetLayout(props.presetId).viewBox;
});

const paintCenter = { x: 2.04, y: 2.04 };
const paintGrid = [
  { x: 1, y: 1 },
  { x: 2, y: 1 },
  { x: 3, y: 1 },
  { x: 1, y: 2 },
  { x: 3, y: 2 },
  { x: 1, y: 3 },
  { x: 2, y: 3 },
  { x: 3, y: 3 },
];

const eraseCenter = { x: 2.04, y: 2.04 };
const eraseFilled = [
  { x: 2.04, y: 1.04 },
  { x: 1.04, y: 2.04 },
  { x: 3.04, y: 2.04 },
  { x: 2.04, y: 3.04 },
];
const eraseGrid = [
  { x: 1, y: 1 },
  { x: 3, y: 1 },
  { x: 1, y: 3 },
  { x: 3, y: 3 },
];
</script>

<style scoped>
.gol-pattern-preview {
  display: block;
  width: 100%;
  height: 100%;
}

.gol-pattern-preview__ghost {
  fill: rgba(255, 255, 255, 0.06);
    stroke: rgba(255, 255, 255, 0.08);
    stroke-width: 0.04;
}

.gol-pattern-preview__cell {
    filter: drop-shadow(0 0 0.35px rgba(95, 212, 168, 0.55));
}

.gol-pattern-preview__cell--dim {
    opacity: 0.45;
}

.gol-pattern-preview__cell--target {
    opacity: 1;
    stroke: rgba(255, 180, 180, 0.9);
    stroke-width: 0.1;
}
</style>
