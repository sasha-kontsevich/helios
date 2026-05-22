<template>
  <div class="ref-inspector">
    <template v-if="rawMode">
      <div v-if="rawError" class="ref-inspector__error">{{ rawError }}</div>
      <div class="ref-inspector__rawGrid">
        <label class="ref-inspector__rawLabel" for="geo-raw-guid">guid</label>
        <input
          id="geo-raw-guid"
          v-model="rawGuid"
          class="inspector__input ref-inspector__guid"
          type="text"
          spellcheck="false"
          autocomplete="off"
          @focus="emit('editingChanged', true)"
          @blur="onRawGuidBlur"
        />
        <label class="ref-inspector__rawLabel ref-inspector__rawLabel--top" for="geo-raw-desc">descriptor</label>
        <textarea
          id="geo-raw-desc"
          v-model="rawDescriptorText"
          class="ref-inspector__json ref-inspector__json--descriptor helios-scroll"
          spellcheck="false"
          @focus="emit('editingChanged', true)"
          @blur="onRawDescriptorBlur"
        />
      </div>
      <p class="ref-inspector__hint">
        JSON только объекта дескриптора; проверка при blur (неверный JSON не применяется).
      </p>
    </template>
    <template v-else-if="guidOnly">
      <div class="ref-inspector__rawGrid">
        <label class="ref-inspector__rawLabel" for="geo-guid-readonly">guid</label>
        <input
          id="geo-guid-readonly"
          class="inspector__input ref-inspector__guid"
          type="text"
          :value="assetGuid"
          readonly
          spellcheck="false"
        />
      </div>
      <p class="ref-inspector__hint">
        Геометрия из импортированной модели (GLTF sub-asset). Редактирование — вкладка Raw.
      </p>
    </template>
    <template v-else>
      <div class="inspector__descriptor">
        <select
          class="inspector__select inspector__select--inline"
          :value="descriptorType"
          @change="onTypeChange(($event.target as HTMLSelectElement).value)"
        >
          <option value="" disabled>Select type…</option>
          <option value="box">box</option>
          <option value="sphere">sphere</option>
          <option value="plane">plane</option>
          <option value="cylinder">cylinder</option>
          <option value="cone">cone</option>
          <option value="torus">torus</option>
        </select>
        <div class="inspector__descriptor-fields">
          <template v-if="descriptorType === 'box'">
            <label class="inspector__mini inspector__mini--scrub" @pointerdown="scrubDesc('width', 1, $event)">w</label>
            <input class="inspector__input" type="number" step="any" :value="strNum(desc.width, 1)" @input="onNum('width', $event)" />
            <label class="inspector__mini inspector__mini--scrub" @pointerdown="scrubDesc('height', 1, $event)">h</label>
            <input class="inspector__input" type="number" step="any" :value="strNum(desc.height, 1)" @input="onNum('height', $event)" />
            <label class="inspector__mini inspector__mini--scrub" @pointerdown="scrubDesc('depth', 1, $event)">d</label>
            <input class="inspector__input" type="number" step="any" :value="strNum(desc.depth, 1)" @input="onNum('depth', $event)" />
          </template>
          <template v-else-if="descriptorType === 'sphere'">
            <label class="inspector__mini inspector__mini--scrub" @pointerdown="scrubDesc('radius', 1, $event)">R</label>
            <input class="inspector__input" type="number" step="any" :value="strNum(desc.radius, 1)" @input="onNum('radius', $event)" />
            <label class="inspector__mini inspector__mini--scrub" @pointerdown="scrubDesc('widthSegments', 32, $event, 'segMin3')">wSeg</label>
            <input class="inspector__input" type="number" step="1" min="3" :value="strNum(desc.widthSegments, 32)" @input="onNum('widthSegments', $event)" />
            <label class="inspector__mini inspector__mini--scrub" @pointerdown="scrubDesc('heightSegments', 16, $event, 'segMin3')">hSeg</label>
            <input class="inspector__input" type="number" step="1" min="3" :value="strNum(desc.heightSegments, 16)" @input="onNum('heightSegments', $event)" />
          </template>
          <template v-else-if="descriptorType === 'plane'">
            <label class="inspector__mini inspector__mini--scrub" @pointerdown="scrubDesc('width', 1, $event)">w</label>
            <input class="inspector__input" type="number" step="any" :value="strNum(desc.width, 1)" @input="onNum('width', $event)" />
            <label class="inspector__mini inspector__mini--scrub" @pointerdown="scrubDesc('height', 1, $event)">h</label>
            <input class="inspector__input" type="number" step="any" :value="strNum(desc.height, 1)" @input="onNum('height', $event)" />
            <label class="inspector__mini inspector__mini--scrub" @pointerdown="scrubDesc('widthSegments', 1, $event, 'segMin1')">wSeg</label>
            <input class="inspector__input" type="number" step="1" min="1" :value="strNum(desc.widthSegments, 1)" @input="onNum('widthSegments', $event)" />
            <label class="inspector__mini inspector__mini--scrub" @pointerdown="scrubDesc('heightSegments', 1, $event, 'segMin1')">hSeg</label>
            <input class="inspector__input" type="number" step="1" min="1" :value="strNum(desc.heightSegments, 1)" @input="onNum('heightSegments', $event)" />
          </template>
          <template v-else-if="descriptorType === 'cylinder'">
            <label class="inspector__mini inspector__mini--scrub" @pointerdown="scrubDesc('radiusTop', 1, $event)">rTop</label>
            <input class="inspector__input" type="number" step="any" :value="strNum(desc.radiusTop, 1)" @input="onNum('radiusTop', $event)" />
            <label class="inspector__mini inspector__mini--scrub" @pointerdown="scrubDesc('radiusBottom', 1, $event)">rBot</label>
            <input class="inspector__input" type="number" step="any" :value="strNum(desc.radiusBottom, 1)" @input="onNum('radiusBottom', $event)" />
            <label class="inspector__mini inspector__mini--scrub" @pointerdown="scrubDesc('height', 1, $event)">h</label>
            <input class="inspector__input" type="number" step="any" :value="strNum(desc.height, 1)" @input="onNum('height', $event)" />
            <label class="inspector__mini inspector__mini--scrub" @pointerdown="scrubDesc('radialSegments', 32, $event, 'segMin3')">rad</label>
            <input class="inspector__input" type="number" step="1" min="3" :value="strNum(desc.radialSegments, 32)" @input="onNum('radialSegments', $event)" />
          </template>
          <template v-else-if="descriptorType === 'cone'">
            <label class="inspector__mini inspector__mini--scrub" @pointerdown="scrubDesc('radius', 1, $event)">r</label>
            <input class="inspector__input" type="number" step="any" :value="strNum(desc.radius, 1)" @input="onNum('radius', $event)" />
            <label class="inspector__mini inspector__mini--scrub" @pointerdown="scrubDesc('height', 1, $event)">h</label>
            <input class="inspector__input" type="number" step="any" :value="strNum(desc.height, 1)" @input="onNum('height', $event)" />
            <label class="inspector__mini inspector__mini--scrub" @pointerdown="scrubDesc('radialSegments', 32, $event, 'segMin3')">rad</label>
            <input class="inspector__input" type="number" step="1" min="3" :value="strNum(desc.radialSegments, 32)" @input="onNum('radialSegments', $event)" />
          </template>
          <template v-else-if="descriptorType === 'torus'">
            <label class="inspector__mini inspector__mini--scrub" @pointerdown="scrubDesc('radius', 1, $event)">R</label>
            <input class="inspector__input" type="number" step="any" :value="strNum(desc.radius, 1)" @input="onNum('radius', $event)" />
            <label class="inspector__mini inspector__mini--scrub" @pointerdown="scrubDesc('tube', 0.4, $event)">tube</label>
            <input class="inspector__input" type="number" step="any" :value="strNum(desc.tube, 0.4)" @input="onNum('tube', $event)" />
            <label class="inspector__mini inspector__mini--scrub" @pointerdown="scrubDesc('radialSegments', 16, $event, 'segMin3')">rad</label>
            <input class="inspector__input" type="number" step="1" min="3" :value="strNum(desc.radialSegments, 16)" @input="onNum('radialSegments', $event)" />
            <label class="inspector__mini inspector__mini--scrub" @pointerdown="scrubDesc('tubularSegments', 48, $event, 'segMin3')">tub</label>
            <input class="inspector__input" type="number" step="1" min="3" :value="strNum(desc.tubularSegments, 48)" @input="onNum('tubularSegments', $event)" />
          </template>
          <template v-else>
            <div class="inspector__readonly">Unsupported descriptor</div>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  DEFAULT_GEOMETRY,
  defaultGeometryDescriptor,
  parseGeometryDescriptor,
  type GeometryDescriptor,
} from "@merlinn/helios-core";
import { attachNumericScrub } from "./useNumericLabelScrub";

const props = defineProps<{
  componentName: "Geometry";
  fields: Record<string, unknown>;
  /** Unused; kept so the panel can pass the same prop bag to all inspector extensions. */
  selectedEid?: number | null;
  rawMode: boolean;
}>();

const emit = defineEmits<{
  applyPatch: [payload: { componentName: string; patch: Record<string, unknown> }];
  editingChanged: [isEditing: boolean];
}>();

const rawGuid = ref("");
const rawDescriptorText = ref("");
const rawError = ref("");

function getDescriptor(): Record<string, unknown> {
  const v = props.fields["descriptor"];
  return v && typeof v === "object" ? { ...(v as Record<string, unknown>) } : {};
}

const desc = computed(() => getDescriptor());

const descriptorType = computed(() => {
  const t = desc.value.type;
  return typeof t === "string" ? t : "";
});

const assetGuid = computed(() => {
  const g = props.fields["guid"];
  return typeof g === "string" ? g : "";
});

const guidOnly = computed(() => assetGuid.value.length > 0 && !descriptorType.value);

function strNum(v: unknown, fallback: number): string {
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return String(fallback);
}

function scheduleApply(patch: Record<string, unknown>) {
  emit("applyPatch", { componentName: props.componentName, patch });
}

function onDescriptorChange(next: Record<string, unknown>) {
  scheduleApply({ descriptor: next });
}

function onTypeChange(type: string): void {
  if (type in DEFAULT_GEOMETRY) {
    const d = defaultGeometryDescriptor(type as GeometryDescriptor["type"]);
    onDescriptorChange({ ...d });
    return;
  }
  onDescriptorChange({ type });
}

function onNum(key: string, event: Event): void {
  const input = event.target as HTMLInputElement;
  const parsed = parseFloat(input.value);
  if (!Number.isFinite(parsed)) return;
  onDescriptorChange({ ...desc.value, [key]: parsed });
}

type DescriptorScrubSegment = "float" | "segMin3" | "segMin1";

function scrubDesc(key: string, fallback: number, event: PointerEvent, segment: DescriptorScrubSegment = "float"): void {
  attachNumericScrub({
    event,
    getValue: () => {
      const v = desc.value[key];
      return typeof v === "number" && Number.isFinite(v) ? v : fallback;
    },
    commit: (raw) => {
      let v = raw;
      if (segment === "segMin3") v = Math.max(3, Math.floor(v));
      if (segment === "segMin1") v = Math.max(1, Math.floor(v));
      onDescriptorChange({ ...desc.value, [key]: v });
    },
    onEditingStart: () => emit("editingChanged", true),
    onEditingEnd: () => emit("editingChanged", false),
  });
}

function syncRawFromFields(): void {
  const guid = props.fields["guid"];
  rawGuid.value = typeof guid === "string" ? guid : typeof guid === "number" ? String(guid) : "";
  const descriptor = props.fields["descriptor"];
  rawDescriptorText.value = JSON.stringify(
    descriptor && typeof descriptor === "object" ? descriptor : {},
    null,
    2,
  );
}

watch(
  () => [props.fields, props.rawMode] as const,
  () => {
    rawError.value = "";
    if (props.rawMode) syncRawFromFields();
  },
  { immediate: true, deep: true },
);

function onRawGuidBlur(): void {
  emit("editingChanged", false);
  rawError.value = "";
  scheduleApply({ guid: rawGuid.value });
}

function onRawDescriptorBlur(): void {
  emit("editingChanged", false);
  rawError.value = "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawDescriptorText.value);
  } catch {
    rawError.value = "Descriptor: невалидный JSON";
    return;
  }
  const parsedDesc = parseGeometryDescriptor(parsed);
  if (!parsedDesc) {
    rawError.value = "Descriptor: неизвестный тип или поля";
    return;
  }
  scheduleApply({
    guid: rawGuid.value,
    descriptor: parsedDesc as unknown as Record<string, unknown>,
  });
}
</script>

<style scoped>
.ref-inspector {
  width: 100%;
}
.ref-inspector__rawGrid {
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 8px 10px;
  align-items: center;
}
.ref-inspector__rawLabel {
  font-size: 10px;
  color: #888;
  user-select: none;
}
.ref-inspector__rawLabel--top {
  align-self: start;
  padding-top: 6px;
}
.ref-inspector__guid {
  width: 100%;
}
.ref-inspector__json {
  width: 100%;
  box-sizing: border-box;
  padding: 6px 8px;
  font-size: 11px;
  font-family: ui-monospace, monospace;
  color: #eee;
  background: #0d0d0d;
  border: 1px solid #444;
  border-radius: 2px;
  resize: vertical;
}
.ref-inspector__json--descriptor {
  min-height: 100px;
}
.ref-inspector__hint {
  margin: 8px 0 0;
  font-size: 10px;
  line-height: 1.35;
  color: #666;
}
.ref-inspector__error {
  color: #f66;
  font-size: 11px;
  margin-bottom: 6px;
}
.inspector__descriptor {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.inspector__descriptor-fields {
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 6px;
  align-items: center;
}
.inspector__mini {
  color: #777;
  font-size: 10px;
  user-select: none;
}
.inspector__mini--scrub {
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
}
.inspector__select {
  height: 22px;
  font-size: 11px;
  color: #eee;
  background: #111;
  border: 1px solid #444;
  border-radius: 2px;
  padding: 0 6px;
}
.inspector__select--inline {
  width: 100%;
}
</style>
