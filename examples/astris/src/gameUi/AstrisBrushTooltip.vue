<template>
  <div
    ref="wrapRef"
    class="astris-brush-tooltip-wrap"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
    @focusin="onEnter"
    @focusout="onLeave"
  >
    <slot />
    <Teleport to="body">
      <div
        v-show="visible"
        class="astris-brush-tooltip"
        :class="`astris-brush-tooltip--${placement}`"
        :style="tooltipStyle"
        role="tooltip"
      >
        <span class="astris-brush-tooltip__tag">{{ info.tag }}</span>
        <h4 class="astris-brush-tooltip__title">{{ info.title }}</h4>
        <p class="astris-brush-tooltip__body">{{ info.body }}</p>
        <p v-if="armedHint" class="astris-brush-tooltip__hint">{{ armedHint }}</p>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref } from "vue";
import type { GolPresetTooltip } from "../game/golPresetTooltips";

const props = withDefaults(
  defineProps<{
    info: GolPresetTooltip;
    placement?: "right" | "left";
    armedHint?: string | null;
  }>(),
  {
    placement: "right",
    armedHint: null,
  },
);

const wrapRef = ref<HTMLElement | null>(null);
const visible = ref(false);
const pos = ref({ top: 0, left: 0 });

let showTimer: ReturnType<typeof setTimeout> | undefined;
let hideTimer: ReturnType<typeof setTimeout> | undefined;

const tooltipStyle = computed(() => ({
  top: `${pos.value.top}px`,
  left: `${pos.value.left}px`,
}));

function updatePosition(): void {
  const el = wrapRef.value;
  if (!el) {
    return;
  }
  const rect = el.getBoundingClientRect();
  const gap = 10;
  const estHeight = 120;
  const top = Math.max(8, Math.min(rect.top + rect.height / 2 - estHeight / 2, window.innerHeight - estHeight - 8));
  const left =
    props.placement === "right"
      ? Math.min(rect.right + gap, window.innerWidth - 280)
      : Math.max(8, rect.left - gap - 268);
  pos.value = { top, left };
}

function onEnter(): void {
  if (hideTimer !== undefined) {
    clearTimeout(hideTimer);
    hideTimer = undefined;
  }
  if (showTimer !== undefined) {
    return;
  }
  showTimer = setTimeout(() => {
    showTimer = undefined;
    updatePosition();
    visible.value = true;
    void nextTick(updatePosition);
  }, 280);
}

function onLeave(): void {
  if (showTimer !== undefined) {
    clearTimeout(showTimer);
    showTimer = undefined;
  }
  hideTimer = setTimeout(() => {
    hideTimer = undefined;
    visible.value = false;
  }, 80);
}

onUnmounted(() => {
  if (showTimer !== undefined) {
    clearTimeout(showTimer);
  }
  if (hideTimer !== undefined) {
    clearTimeout(hideTimer);
  }
});
</script>
