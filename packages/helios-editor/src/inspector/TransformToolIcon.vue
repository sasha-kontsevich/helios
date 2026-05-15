<template>
  <svg
    class="shell__toolIcon"
    viewBox="0 0 24 24"
    :width="size"
    :height="size"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <template v-if="kind === 'move'">
      <polyline points="5 9 2 12 5 15" />
      <polyline points="9 5 12 2 15 5" />
      <polyline points="15 19 12 22 9 19" />
      <polyline points="19 9 22 12 19 15" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="12" y1="2" x2="12" y2="22" />
    </template>
    <template v-else-if="kind === 'rotate'">
      <path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.9 1 6.7 2.7L21 8" />
      <polyline points="21 3 21 8 16 8" />
    </template>
    <template v-else-if="kind === 'scale'">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </template>
    <template v-else-if="kind === 'eye'">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </template>
    <template v-else-if="kind === 'eye-off'">
      <path d="M10.73 5.08A10.7 10.7 0 0 1 22 12c0 2.5-1 4.8-2.7 6.5" />
      <path d="M14.13 14.13a3 3 0 1 1-4.24-4.24" />
      <path d="M17.5 17.5A10.7 10.7 0 0 1 2 12c0-1.5.3-2.9.8-4.2" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </template>
    <template v-else-if="kind === 'play'">
      <path
        fill="currentColor"
        stroke="none"
        d="M8 5.5v13L19 12 8 5.5Z"
      />
    </template>
    <template v-else-if="kind === 'stop'">
      <rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="kind === 'pause'">
      <rect x="7" y="6" width="3.5" height="12" rx="0.75" fill="currentColor" stroke="none" />
      <rect x="13.5" y="6" width="3.5" height="12" rx="0.75" fill="currentColor" stroke="none" />
    </template>
  </svg>
</template>

<script setup lang="ts">
export type TransformToolIconKind =
  | "move"
  | "rotate"
  | "scale"
  | "eye"
  | "eye-off"
  | "play"
  | "stop"
  | "pause";

withDefaults(
  defineProps<{
    kind: TransformToolIconKind;
    /** Pixel size of the icon (width and height). */
    size?: number;
  }>(),
  { size: 18 },
);
</script>

<style scoped>
.shell__toolIcon {
  display: block;
  flex-shrink: 0;
  pointer-events: none;
}
</style>
