<template>
  <div class="system-list">
    <ul class="system-list__ul helios-scroll">
      <li
        v-for="sys in systems"
        :key="sys.name"
        class="system-list__item"
        :class="{ 'system-list__item--dim': !sys.enabled }"
      >
        <span
          class="system-list__name"
          :title="sys.description.length > 0 ? sys.description : sys.name"
        >{{ sys.name }}</span>
        <span class="system-list__badges">
          <button
            type="button"
            class="system-list__badge system-list__badge--toggle"
            :class="{ 'system-list__badge--on': sys.enabled }"
            :title="
              sys.enabled
                ? 'Disable system (stop + disable)'
                : 'Enable system (enable + start)'
            "
            :aria-pressed="sys.enabled"
            :aria-label="`${sys.enabled ? 'Disable' : 'Enable'} ${sys.name}`"
            @click="$emit('toggle-enabled', sys.name, !sys.enabled)"
          >
            On
          </button>
          <span
            class="system-list__badge"
            :class="{ 'system-list__badge--on': sys.started }"
            title="start() was called for this instance"
          >Start</span>
          <span
            v-if="sys.runsInEditor"
            class="system-list__badge system-list__badge--ed"
            title="runsInEditor: editor layer, active without Play"
          >Ed</span>
          <span
            class="system-list__badge"
            :class="{ 'system-list__badge--on': sys.updateActive }"
            title="update runs (matches On)"
          >Δ</span>
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { SystemRuntimeSnapshot } from "@merlinn/helios-core";

defineProps<{
  systems: SystemRuntimeSnapshot[];
}>();

defineEmits<{
  "toggle-enabled": [name: string, enabled: boolean];
}>();
</script>

<style scoped>
.system-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.system-list__ul {
  list-style: none;
  margin: 0;
  padding: 4px 0;
  flex: 1;
}
.system-list__item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  min-height: var(--helios-list-row-height);
  padding: 0 var(--helios-list-row-pad-x);
  font-size: 12px;
  color: #ddd;
  min-width: 0;
}
.system-list__item--dim {
  color: #777;
}
.system-list__name {
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  color: #e8e8e8;
}
.system-list__item--dim .system-list__name {
  color: #888;
}
.system-list__badges {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 3px;
}
.system-list__badge {
  font-size: 9px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  padding: 1px 4px;
  border-radius: 3px;
  border: 1px solid #444;
  background: #252525;
  color: #666;
  user-select: none;
}
.system-list__badge--toggle {
  cursor: pointer;
  font: inherit;
}
.system-list__badge--toggle:hover {
  border-color: #666;
  color: #bbb;
}
.system-list__badge--toggle.system-list__badge--on:hover {
  border-color: #4a8a5a;
  color: #c8f0d8;
}
.system-list__badge--on {
  border-color: #3a6a4a;
  background: #1a2e22;
  color: #8fd4a8;
}
.system-list__badge--ed {
  border-color: #4a5a6a;
  background: #1e2830;
  color: #9cb8d0;
}
</style>
