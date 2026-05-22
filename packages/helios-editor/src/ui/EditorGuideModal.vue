<template>
  <Teleport to="body">
    <div
      v-show="open"
      class="guide-overlay"
      data-helios-editor-overlay
      @click.self="close"
    >
      <div
        ref="panelEl"
        class="guide-panel"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-guide-title"
        @keydown.escape.prevent="close"
      >
        <header class="guide-panel__header">
          <h2 id="editor-guide-title" class="guide-panel__title">Welcome to the editor</h2>
          <button
            type="button"
            class="guide-panel__close"
            title="Close"
            aria-label="Close help"
            @click="close"
          >
            ×
          </button>
        </header>

        <div class="guide-panel__body helios-scroll">
          <section
            v-for="section in sections"
            :key="section.id"
            class="guide-section"
          >
            <h3 class="guide-section__title">{{ section.title }}</h3>
            <ul class="guide-section__list">
              <li v-for="(line, i) in section.bullets" :key="i">{{ line }}</li>
            </ul>
          </section>
        </div>

        <footer class="guide-panel__footer">
          <label class="guide-panel__dismiss">
            <input v-model="dontShowAgain" type="checkbox" />
            <span>Don't show on startup</span>
          </label>
          <button type="button" class="guide-panel__primary" @click="close">
            Got it
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { EditorGuideSection } from "../guide/editorGuideTypes";
import { setGuideDismissed } from "../guide/editorGuideStorage";

const props = defineProps<{
  open: boolean;
  sections: EditorGuideSection[];
  storageKey: string;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
}>();

const panelEl = ref<HTMLElement | null>(null);
const dontShowAgain = ref(true);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      requestAnimationFrame(() => {
        panelEl.value?.focus();
      });
    }
  },
);

function close(): void {
  if (dontShowAgain.value) {
    setGuideDismissed(props.storageKey, true);
  }
  emit("update:open", false);
}
</script>

<style scoped>
.guide-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.55);
}

.guide-panel {
  display: flex;
  flex-direction: column;
  width: min(520px, 100%);
  max-height: min(80vh, 640px);
  border: 1px solid #444;
  border-radius: 8px;
  background: #252525;
  color: #e5e7eb;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
  outline: none;
}

.guide-panel__header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid #333;
}

.guide-panel__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #f3f4f6;
}

.guide-panel__close {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid #4b5563;
  border-radius: 4px;
  background: #2a3038;
  color: #d1d5db;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}

.guide-panel__close:hover {
  background: #374151;
  color: #fff;
}

.guide-panel__body {
  flex: 1;
  padding: 12px 14px 8px;
}

.guide-section {
  margin-bottom: 14px;
}

.guide-section:last-child {
  margin-bottom: 0;
}

.guide-section__title {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 600;
  color: #93c5fd;
}

.guide-section__list {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  line-height: 1.45;
  color: #d1d5db;
}

.guide-section__list li + li {
  margin-top: 4px;
}

.guide-panel__footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px 12px;
  border-top: 1px solid #333;
}

.guide-panel__dismiss {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #9ca3af;
  cursor: pointer;
  user-select: none;
}

.guide-panel__primary {
  padding: 6px 14px;
  border-radius: 4px;
  border: 1px solid #5a8ab8;
  background: #3d5a7a;
  color: #f9fafb;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.guide-panel__primary:hover {
  background: #4a6d92;
}
</style>
