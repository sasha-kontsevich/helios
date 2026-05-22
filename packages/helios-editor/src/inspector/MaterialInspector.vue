<template>
  <div class="ref-inspector">
    <template v-if="rawMode">
      <div v-if="rawError" class="ref-inspector__error">{{ rawError }}</div>
      <div class="ref-inspector__rawGrid">
        <label class="ref-inspector__rawLabel" for="mat-raw-guid">guid</label>
        <input
          id="mat-raw-guid"
          v-model="rawGuid"
          class="inspector__input ref-inspector__guid"
          type="text"
          spellcheck="false"
          autocomplete="off"
          @focus="emit('editingChanged', true)"
          @blur="onRawGuidBlur"
        />
        <label class="ref-inspector__rawLabel ref-inspector__rawLabel--top" for="mat-raw-desc">descriptor</label>
        <textarea
          id="mat-raw-desc"
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
        <label class="ref-inspector__rawLabel" for="mat-guid-readonly">guid</label>
        <input
          id="mat-guid-readonly"
          class="inspector__input ref-inspector__guid"
          type="text"
          :value="assetGuid"
          readonly
          spellcheck="false"
        />
      </div>
      <p class="ref-inspector__hint">
        Материал из импортированной модели (GLTF sub-asset). Редактирование — вкладка Raw.
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
          <option value="meshBasic">meshBasic</option>
          <option value="meshLambert">meshLambert</option>
          <option value="meshStandard">meshStandard</option>
        </select>
        <div class="inspector__descriptor-fields">
          <template v-if="descriptorType === 'meshBasic'">
            <label class="inspector__mini inspector__mini--scrub" @pointerdown="scrubColorInt('color', 0xffffff, $event)">color</label>
            <div class="inspector__color-row">
              <input
                class="inspector__color"
                type="color"
                :value="colorIntToHex(desc.color ?? 0xffffff)"
                @input="onColor('color', ($event.target as HTMLInputElement).value)"
              />
              <input
                class="inspector__input"
                type="text"
                spellcheck="false"
                :value="colorIntToHex(desc.color ?? 0xffffff)"
                @input="onColor('color', ($event.target as HTMLInputElement).value)"
              />
            </div>
            <label class="inspector__mini">wire</label>
            <input class="inspector__checkbox" type="checkbox" :checked="Boolean(desc.wireframe)" @change="onBool('wireframe', $event)" />
            <TextureGuidFields
              :slots="textureSlots"
              :values="desc"
              @patch="onTextureGuids"
              @editing-changed="emit('editingChanged', $event)"
            />
          </template>

          <template v-else-if="descriptorType === 'meshLambert'">
            <label class="inspector__mini inspector__mini--scrub" @pointerdown="scrubColorInt('color', 0xffffff, $event)">color</label>
            <div class="inspector__color-row">
              <input
                class="inspector__color"
                type="color"
                :value="colorIntToHex(desc.color ?? 0xffffff)"
                @input="onColor('color', ($event.target as HTMLInputElement).value)"
              />
              <input
                class="inspector__input"
                type="text"
                spellcheck="false"
                :value="colorIntToHex(desc.color ?? 0xffffff)"
                @input="onColor('color', ($event.target as HTMLInputElement).value)"
              />
            </div>
            <label class="inspector__mini inspector__mini--scrub" @pointerdown="scrubColorInt('emissive', 0, $event)">emis</label>
            <div class="inspector__color-row">
              <input
                class="inspector__color"
                type="color"
                :value="colorIntToHex(desc.emissive ?? 0)"
                @input="onColor('emissive', ($event.target as HTMLInputElement).value)"
              />
              <input
                class="inspector__input"
                type="text"
                spellcheck="false"
                :value="colorIntToHex(desc.emissive ?? 0)"
                @input="onColor('emissive', ($event.target as HTMLInputElement).value)"
              />
            </div>
            <label class="inspector__mini">wire</label>
            <input class="inspector__checkbox" type="checkbox" :checked="Boolean(desc.wireframe)" @change="onBool('wireframe', $event)" />
            <TextureGuidFields
              :slots="textureSlots"
              :values="desc"
              @patch="onTextureGuids"
              @editing-changed="emit('editingChanged', $event)"
            />
          </template>

          <template v-else-if="descriptorType === 'meshStandard'">
            <label class="inspector__mini inspector__mini--scrub" @pointerdown="scrubColorInt('color', 0xffffff, $event)">color</label>
            <div class="inspector__color-row">
              <input
                class="inspector__color"
                type="color"
                :value="colorIntToHex(desc.color ?? 0xffffff)"
                @input="onColor('color', ($event.target as HTMLInputElement).value)"
              />
              <input
                class="inspector__input"
                type="text"
                spellcheck="false"
                :value="colorIntToHex(desc.color ?? 0xffffff)"
                @input="onColor('color', ($event.target as HTMLInputElement).value)"
              />
            </div>
            <label class="inspector__mini inspector__mini--scrub" @pointerdown="scrubUnit('roughness', 1, $event)">rough</label>
            <input
              class="inspector__input"
              type="number"
              step="any"
              min="0"
              max="1"
              :value="String(desc.roughness ?? 1)"
              @input="onRoughMetal('roughness', $event)"
            />
            <label class="inspector__mini inspector__mini--scrub" @pointerdown="scrubUnit('metalness', 0, $event)">metal</label>
            <input
              class="inspector__input"
              type="number"
              step="any"
              min="0"
              max="1"
              :value="String(desc.metalness ?? 0)"
              @input="onRoughMetal('metalness', $event)"
            />
            <label class="inspector__mini">wire</label>
            <input class="inspector__checkbox" type="checkbox" :checked="Boolean(desc.wireframe)" @change="onBool('wireframe', $event)" />
            <TextureGuidFields
              :slots="textureSlots"
              :values="desc"
              @patch="onTextureGuids"
              @editing-changed="emit('editingChanged', $event)"
            />
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
  DEFAULT_MATERIAL,
  defaultMaterialDescriptor,
  materialTextureSlotsForType,
  parseMaterialDescriptor,
  type MaterialDescriptor,
  type MaterialTextureSlot,
} from "@merlinn/helios-core";
import TextureGuidFields from "./TextureGuidFields.vue";
import { attachNumericScrub } from "./useNumericLabelScrub";

const props = defineProps<{
  componentName: "Material";
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

const textureSlots = computed((): MaterialTextureSlot[] => {
  const t = descriptorType.value;
  if (t === "meshBasic" || t === "meshLambert" || t === "meshStandard") {
    return materialTextureSlotsForType(t);
  }
  return [];
});

function scheduleApply(patch: Record<string, unknown>) {
  emit("applyPatch", { componentName: props.componentName, patch });
}

function onDescriptorChange(next: Record<string, unknown>) {
  scheduleApply({ descriptor: next });
}

function onTextureGuids(patch: Partial<Record<MaterialTextureSlot, string>>): void {
  const next = { ...desc.value };
  for (const [slot, guid] of Object.entries(patch)) {
    const g = typeof guid === "string" ? guid.trim() : "";
    if (g.length > 0) {
      next[slot] = g;
    } else {
      delete next[slot];
    }
  }
  onDescriptorChange(next);
}

function onTypeChange(type: string): void {
  if (type in DEFAULT_MATERIAL) {
    const d = defaultMaterialDescriptor(type as MaterialDescriptor["type"]);
    onDescriptorChange({ ...d } as Record<string, unknown>);
    return;
  }
  onDescriptorChange({ type });
}

function clampColorInt(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(0xffffff, Math.max(0, Math.floor(n)));
}

function colorIntToHex(n: unknown): string {
  const v = clampColorInt(typeof n === "number" ? n : 0);
  return `#${v.toString(16).padStart(6, "0")}`;
}

function hexToColorInt(hex: string): number | null {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return null;
  return parseInt(m[1], 16);
}

function onColor(key: string, hex: string): void {
  const parsed = hexToColorInt(hex);
  if (parsed === null) return;
  onDescriptorChange({ ...desc.value, [key]: parsed });
}

function onBool(key: string, event: Event): void {
  const input = event.target as HTMLInputElement;
  onDescriptorChange({ ...desc.value, [key]: input.checked });
}

function onRoughMetal(key: "roughness" | "metalness", event: Event): void {
  const input = event.target as HTMLInputElement;
  const parsed = parseFloat(input.value);
  if (!Number.isFinite(parsed)) return;
  onDescriptorChange({ ...desc.value, [key]: parsed });
}

function scrubUnit(key: "roughness" | "metalness", fallback: number, event: PointerEvent): void {
  attachNumericScrub({
    event,
    getValue: () => {
      const v = desc.value[key];
      return typeof v === "number" && Number.isFinite(v) ? v : fallback;
    },
    commit: (raw) => {
      const v = Math.min(1, Math.max(0, raw));
      onDescriptorChange({ ...desc.value, [key]: v });
    },
    onEditingStart: () => emit("editingChanged", true),
    onEditingEnd: () => emit("editingChanged", false),
  });
}

function scrubColorInt(key: "color" | "emissive", fallback: number, event: PointerEvent): void {
  attachNumericScrub({
    event,
    getValue: () => {
      const v = desc.value[key];
      return typeof v === "number" && Number.isFinite(v) ? clampColorInt(v) : fallback;
    },
    commit: (raw) => {
      onDescriptorChange({ ...desc.value, [key]: clampColorInt(Math.floor(raw)) });
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
  const parsedDesc = parseMaterialDescriptor(parsed);
  if (!parsedDesc) {
    rawError.value = "Descriptor: неизвестный тип или поля";
    return;
  }
  scheduleApply({
    guid: "",
    descriptor: parsedDesc as unknown as Record<string, unknown>,
  });
  rawGuid.value = "";
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
.inspector__checkbox {
  width: 16px;
  height: 16px;
}
.inspector__color-row {
  display: flex;
  gap: 6px;
  align-items: center;
}
.inspector__color {
  width: 28px;
  height: 22px;
  padding: 0;
  border: 1px solid #444;
  border-radius: 2px;
  background: #111;
}
</style>
