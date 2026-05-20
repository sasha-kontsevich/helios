<template>
  <svg
    class="astris-cockpit__icon"
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
    <template v-if="kind === 'play'">
      <polygon points="8 5 19 12 8 19 8 5" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="kind === 'pause'">
      <rect x="7" y="5" width="3" height="14" fill="currentColor" stroke="none" />
      <rect x="14" y="5" width="3" height="14" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="kind === 'stop'">
      <rect x="7" y="7" width="10" height="10" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="kind === 'trash'">
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 12a1 1 0 0 0 1 .9h8a1 1 0 0 0 1-.9l1-12" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </template>
    <template v-else-if="kind === 'pencil'">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </template>
    <template v-else-if="kind === 'eraser'">
      <path d="m7 21-4-4L15 5l4 4Z" />
      <path d="M22 21H7" />
      <path d="m18 9 3 3" />
    </template>
    <template v-else-if="kind === 'chevron'">
      <polyline :points="expanded ? '6 15 12 9 18 15' : '6 9 12 15 18 9'" />
    </template>
  </svg>
</template>

<script setup lang="ts">
defineProps<{
  kind: "play" | "pause" | "stop" | "trash" | "pencil" | "eraser" | "chevron";
  size?: number;
  expanded?: boolean;
}>();
</script>
