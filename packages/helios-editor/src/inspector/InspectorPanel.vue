<template>
  <div class="inspector" @contextmenu="onInspectorPanelContextMenu">
    <div class="inspector__header">
      <span>Components</span>
    </div>
    <div v-if="selectedEid === null" class="inspector__empty">Select an entity</div>
    <div v-else-if="snapshot" class="inspector__body">
      <section
        v-for="(fields, compName) in snapshot.components"
        :key="compName"
        class="inspector__component"
      >
        <div
          class="inspector__comp-row"
          @contextmenu.stop.prevent="onComponentRowContextMenu($event, String(compName))"
        >
          <h3 class="inspector__comp-title">{{ compName }}</h3>
        </div>
        <div
          v-for="(value, fieldKey) in fields"
          :key="fieldKey"
          class="inspector__field"
        >
          <label
            class="inspector__label"
            :class="{ 'inspector__label--draggable': isEditableField(String(fieldKey), value) }"
            @pointerdown="
              isEditableField(String(fieldKey), value) &&
                onLabelPointerDown(String(compName), String(fieldKey), value, $event)
            "
          >
            {{ fieldKey }}
          </label>
          <div v-if="isDescriptorField(String(compName), String(fieldKey))" class="inspector__descriptor">
            <select
              class="inspector__select inspector__select--inline"
              :value="getDescriptorType(getDescriptor(String(compName), fields as any))"
              @change="setDescriptorType(String(compName), ($event.target as HTMLSelectElement).value)"
            >
              <option value="" disabled>Select type…</option>
              <template v-if="String(compName) === 'ThreeGeometryRef'">
                <option value="box">box</option>
                <option value="sphere">sphere</option>
                <option value="plane">plane</option>
                <option value="cylinder">cylinder</option>
                <option value="cone">cone</option>
                <option value="torus">torus</option>
              </template>
              <template v-else-if="String(compName) === 'ThreeMaterialRef'">
                <option value="meshBasic">meshBasic</option>
                <option value="meshLambert">meshLambert</option>
                <option value="meshStandard">meshStandard</option>
              </template>
            </select>
            <div class="inspector__descriptor-fields">
              <template v-if="String(compName) === 'ThreeGeometryRef' && getDescriptorType(getDescriptor(String(compName), fields as any)) === 'box'">
                <label class="inspector__mini">w</label>
                <input class="inspector__input" type="number" step="any"
                  :value="String((getDescriptor(String(compName), fields as any)).width ?? 1)"
                  @input="onDescriptorNumberField(String(compName), fields as any, 'width', $event)"
                />
                <label class="inspector__mini">h</label>
                <input class="inspector__input" type="number" step="any"
                  :value="String((getDescriptor(String(compName), fields as any)).height ?? 1)"
                  @input="onDescriptorNumberField(String(compName), fields as any, 'height', $event)"
                />
                <label class="inspector__mini">d</label>
                <input class="inspector__input" type="number" step="any"
                  :value="String((getDescriptor(String(compName), fields as any)).depth ?? 1)"
                  @input="onDescriptorNumberField(String(compName), fields as any, 'depth', $event)"
                />
              </template>

              <template v-else-if="String(compName) === 'ThreeGeometryRef' && getDescriptorType(getDescriptor(String(compName), fields as any)) === 'sphere'">
                <label class="inspector__mini">R</label>
                <input class="inspector__input" type="number" step="any"
                  :value="String((getDescriptor(String(compName), fields as any)).radius ?? 1)"
                  @input="onDescriptorNumberField(String(compName), fields as any, 'radius', $event)"
                />
                <label class="inspector__mini">wSeg</label>
                <input class="inspector__input" type="number" step="1" min="3"
                  :value="String((getDescriptor(String(compName), fields as any)).widthSegments ?? 32)"
                  @input="onDescriptorNumberField(String(compName), fields as any, 'widthSegments', $event)"
                />
                <label class="inspector__mini">hSeg</label>
                <input class="inspector__input" type="number" step="1" min="3"
                  :value="String((getDescriptor(String(compName), fields as any)).heightSegments ?? 16)"
                  @input="onDescriptorNumberField(String(compName), fields as any, 'heightSegments', $event)"
                />
              </template>

              <template v-else-if="String(compName) === 'ThreeGeometryRef' && getDescriptorType(getDescriptor(String(compName), fields as any)) === 'plane'">
                <label class="inspector__mini">w</label>
                <input class="inspector__input" type="number" step="any"
                  :value="String((getDescriptor(String(compName), fields as any)).width ?? 1)"
                  @input="onDescriptorNumberField(String(compName), fields as any, 'width', $event)"
                />
                <label class="inspector__mini">h</label>
                <input class="inspector__input" type="number" step="any"
                  :value="String((getDescriptor(String(compName), fields as any)).height ?? 1)"
                  @input="onDescriptorNumberField(String(compName), fields as any, 'height', $event)"
                />
                <label class="inspector__mini">wSeg</label>
                <input class="inspector__input" type="number" step="1" min="1"
                  :value="String((getDescriptor(String(compName), fields as any)).widthSegments ?? 1)"
                  @input="onDescriptorNumberField(String(compName), fields as any, 'widthSegments', $event)"
                />
                <label class="inspector__mini">hSeg</label>
                <input class="inspector__input" type="number" step="1" min="1"
                  :value="String((getDescriptor(String(compName), fields as any)).heightSegments ?? 1)"
                  @input="onDescriptorNumberField(String(compName), fields as any, 'heightSegments', $event)"
                />
              </template>

              <template v-else-if="String(compName) === 'ThreeGeometryRef' && getDescriptorType(getDescriptor(String(compName), fields as any)) === 'cylinder'">
                <label class="inspector__mini">rTop</label>
                <input class="inspector__input" type="number" step="any"
                  :value="String((getDescriptor(String(compName), fields as any)).radiusTop ?? 1)"
                  @input="onDescriptorNumberField(String(compName), fields as any, 'radiusTop', $event)"
                />
                <label class="inspector__mini">rBot</label>
                <input class="inspector__input" type="number" step="any"
                  :value="String((getDescriptor(String(compName), fields as any)).radiusBottom ?? 1)"
                  @input="onDescriptorNumberField(String(compName), fields as any, 'radiusBottom', $event)"
                />
                <label class="inspector__mini">h</label>
                <input class="inspector__input" type="number" step="any"
                  :value="String((getDescriptor(String(compName), fields as any)).height ?? 1)"
                  @input="onDescriptorNumberField(String(compName), fields as any, 'height', $event)"
                />
                <label class="inspector__mini">rad</label>
                <input class="inspector__input" type="number" step="1" min="3"
                  :value="String((getDescriptor(String(compName), fields as any)).radialSegments ?? 32)"
                  @input="onDescriptorNumberField(String(compName), fields as any, 'radialSegments', $event)"
                />
              </template>

              <template v-else-if="String(compName) === 'ThreeGeometryRef' && getDescriptorType(getDescriptor(String(compName), fields as any)) === 'cone'">
                <label class="inspector__mini">r</label>
                <input class="inspector__input" type="number" step="any"
                  :value="String((getDescriptor(String(compName), fields as any)).radius ?? 1)"
                  @input="onDescriptorNumberField(String(compName), fields as any, 'radius', $event)"
                />
                <label class="inspector__mini">h</label>
                <input class="inspector__input" type="number" step="any"
                  :value="String((getDescriptor(String(compName), fields as any)).height ?? 1)"
                  @input="onDescriptorNumberField(String(compName), fields as any, 'height', $event)"
                />
                <label class="inspector__mini">rad</label>
                <input class="inspector__input" type="number" step="1" min="3"
                  :value="String((getDescriptor(String(compName), fields as any)).radialSegments ?? 32)"
                  @input="onDescriptorNumberField(String(compName), fields as any, 'radialSegments', $event)"
                />
              </template>

              <template v-else-if="String(compName) === 'ThreeGeometryRef' && getDescriptorType(getDescriptor(String(compName), fields as any)) === 'torus'">
                <label class="inspector__mini">R</label>
                <input class="inspector__input" type="number" step="any"
                  :value="String((getDescriptor(String(compName), fields as any)).radius ?? 1)"
                  @input="onDescriptorNumberField(String(compName), fields as any, 'radius', $event)"
                />
                <label class="inspector__mini">tube</label>
                <input class="inspector__input" type="number" step="any"
                  :value="String((getDescriptor(String(compName), fields as any)).tube ?? 0.4)"
                  @input="onDescriptorNumberField(String(compName), fields as any, 'tube', $event)"
                />
                <label class="inspector__mini">rad</label>
                <input class="inspector__input" type="number" step="1" min="3"
                  :value="String((getDescriptor(String(compName), fields as any)).radialSegments ?? 16)"
                  @input="onDescriptorNumberField(String(compName), fields as any, 'radialSegments', $event)"
                />
                <label class="inspector__mini">tub</label>
                <input class="inspector__input" type="number" step="1" min="3"
                  :value="String((getDescriptor(String(compName), fields as any)).tubularSegments ?? 48)"
                  @input="onDescriptorNumberField(String(compName), fields as any, 'tubularSegments', $event)"
                />
              </template>

              <template v-else-if="String(compName) === 'ThreeMaterialRef' && getDescriptorType(getDescriptor(String(compName), fields as any)) === 'meshBasic'">
                <label class="inspector__mini">color</label>
                <div class="inspector__color-row">
                  <input
                    class="inspector__color"
                    type="color"
                    :value="colorIntToHex((getDescriptor(String(compName), fields as any)).color ?? 0xffffff)"
                    @input="onDescriptorColorField(String(compName), fields as any, 'color', ($event.target as HTMLInputElement).value)"
                    title="Pick color"
                  />
                  <input
                    class="inspector__input"
                    type="text"
                    spellcheck="false"
                    :value="colorIntToHex((getDescriptor(String(compName), fields as any)).color ?? 0xffffff)"
                    @input="onDescriptorColorField(String(compName), fields as any, 'color', ($event.target as HTMLInputElement).value)"
                    title="#RRGGBB"
                  />
                </div>
                <label class="inspector__mini">wire</label>
                <input class="inspector__checkbox" type="checkbox"
                  :checked="Boolean((getDescriptor(String(compName), fields as any)).wireframe ?? false)"
                  @change="onDescriptorBoolField(String(compName), fields as any, 'wireframe', $event)"
                />
              </template>

              <template v-else-if="String(compName) === 'ThreeMaterialRef' && getDescriptorType(getDescriptor(String(compName), fields as any)) === 'meshLambert'">
                <label class="inspector__mini">color</label>
                <div class="inspector__color-row">
                  <input
                    class="inspector__color"
                    type="color"
                    :value="colorIntToHex((getDescriptor(String(compName), fields as any)).color ?? 0xffffff)"
                    @input="onDescriptorColorField(String(compName), fields as any, 'color', ($event.target as HTMLInputElement).value)"
                  />
                  <input
                    class="inspector__input"
                    type="text"
                    spellcheck="false"
                    :value="colorIntToHex((getDescriptor(String(compName), fields as any)).color ?? 0xffffff)"
                    @input="onDescriptorColorField(String(compName), fields as any, 'color', ($event.target as HTMLInputElement).value)"
                  />
                </div>
                <label class="inspector__mini">emis</label>
                <div class="inspector__color-row">
                  <input
                    class="inspector__color"
                    type="color"
                    :value="colorIntToHex((getDescriptor(String(compName), fields as any)).emissive ?? 0)"
                    @input="onDescriptorColorField(String(compName), fields as any, 'emissive', ($event.target as HTMLInputElement).value)"
                  />
                  <input
                    class="inspector__input"
                    type="text"
                    spellcheck="false"
                    :value="colorIntToHex((getDescriptor(String(compName), fields as any)).emissive ?? 0)"
                    @input="onDescriptorColorField(String(compName), fields as any, 'emissive', ($event.target as HTMLInputElement).value)"
                  />
                </div>
                <label class="inspector__mini">wire</label>
                <input class="inspector__checkbox" type="checkbox"
                  :checked="Boolean((getDescriptor(String(compName), fields as any)).wireframe ?? false)"
                  @change="onDescriptorBoolField(String(compName), fields as any, 'wireframe', $event)"
                />
              </template>

              <template v-else-if="String(compName) === 'ThreeMaterialRef' && getDescriptorType(getDescriptor(String(compName), fields as any)) === 'meshStandard'">
                <label class="inspector__mini">color</label>
                <div class="inspector__color-row">
                  <input
                    class="inspector__color"
                    type="color"
                    :value="colorIntToHex((getDescriptor(String(compName), fields as any)).color ?? 0xffffff)"
                    @input="onDescriptorColorField(String(compName), fields as any, 'color', ($event.target as HTMLInputElement).value)"
                  />
                  <input
                    class="inspector__input"
                    type="text"
                    spellcheck="false"
                    :value="colorIntToHex((getDescriptor(String(compName), fields as any)).color ?? 0xffffff)"
                    @input="onDescriptorColorField(String(compName), fields as any, 'color', ($event.target as HTMLInputElement).value)"
                  />
                </div>
                <label class="inspector__mini">rough</label>
                <input class="inspector__input" type="number" step="any" min="0" max="1"
                  :value="String((getDescriptor(String(compName), fields as any)).roughness ?? 1)"
                  @input="onDescriptorNumberField(String(compName), fields as any, 'roughness', $event)"
                />
                <label class="inspector__mini">metal</label>
                <input class="inspector__input" type="number" step="any" min="0" max="1"
                  :value="String((getDescriptor(String(compName), fields as any)).metalness ?? 0)"
                  @input="onDescriptorNumberField(String(compName), fields as any, 'metalness', $event)"
                />
                <label class="inspector__mini">wire</label>
                <input class="inspector__checkbox" type="checkbox"
                  :checked="Boolean((getDescriptor(String(compName), fields as any)).wireframe ?? false)"
                  @change="onDescriptorBoolField(String(compName), fields as any, 'wireframe', $event)"
                />
              </template>
              <template v-else>
                <div class="inspector__readonly">Unsupported descriptor</div>
              </template>
            </div>
          </div>

          <input
            v-else-if="isGuidField(String(compName), String(fieldKey))"
            class="inspector__input"
            type="text"
            :value="String(value ?? '')"
            @focus="onFocus(String(compName), String(fieldKey))"
            @blur="onBlur"
            @input="onGuidInput(String(compName), $event)"
          />

          <input
            v-else-if="isEditableField(fieldKey, value)"
            class="inspector__input"
            type="number"
            step="any"
            :value="getEditValue(String(compName), String(fieldKey), value)"
            @focus="onFocus(String(compName), String(fieldKey))"
            @blur="onBlur"
            @input="onFieldInput(String(compName), String(fieldKey), $event)"
          />
          <div v-else class="inspector__readonly">
            {{ formatReadonlyValue(value) }}
          </div>
        </div>
      </section>
    </div>
    <div v-else class="inspector__empty">No snapshot</div>
    <ContextMenu
      :visible="ctxVisible"
      :x="ctxX"
      :y="ctxY"
      :items="ctxItems"
      @close="closeContextMenu"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type { EntitySnapshot } from "@merlinn/helios-core";
import ContextMenu from "../ui/contextMenu/ContextMenu.vue";
import type { ContextMenuEntry, ContextMenuItem } from "../ui/contextMenu/contextMenuTypes";
import { useContextMenu } from "../ui/contextMenu/useContextMenu";
import { isReadonlyResourceField } from "./readonlyResourceFields";

const props = defineProps<{
  selectedEid: number | null;
  snapshot: EntitySnapshot | null;
  availableComponents?: string[];
}>();

const emit = defineEmits<{
  applyPatch: [payload: { componentName: string; patch: Record<string, unknown> }];
  editingChanged: [isEditing: boolean];
  addComponent: [componentName: string];
  removeComponent: [componentName: string];
  copyComponent: [componentName: string];
  pasteComponents: [];
}>();

const edits = reactive<Record<string, string>>({});
const focusedKey = ref<string | null>(null);
let rafPending = false;
let lastPayload: { componentName: string; patch: Record<string, unknown> } | null = null;

const drag = reactive({
  active: false,
  pointerId: 0,
  componentName: "",
  fieldKey: "",
  startClientX: 0,
  lastClientX: 0,
  lastTime: 0,
  startValue: 0,
  lastAppliedValue: 0,
});

const availableComponents = computed(() => props.availableComponents ?? []);

const { visible: ctxVisible, x: ctxX, y: ctxY, items: ctxItems, open, close: closeContextMenu } =
  useContextMenu();

const missingComponents = computed(() => {
  const snap = props.snapshot;
  const list = availableComponents.value;
  if (!snap) return list;
  return list.filter((name) => !Object.prototype.hasOwnProperty.call(snap.components, name));
});

function onInspectorPanelContextMenu(ev: MouseEvent): void {
  const t = ev.target;
  if (t instanceof Element) {
    if (t.closest("input, textarea, select") || t.closest('[contenteditable="true"]')) {
      return;
    }
  }
  ev.preventDefault();

  const sel = props.selectedEid;
  const snap = props.snapshot;

  const addChildren: ContextMenuItem[] =
    sel !== null && snap
      ? missingComponents.value.length === 0
        ? [{ id: "add-none", label: "All components added", disabled: true, onSelect: () => {} }]
        : missingComponents.value.map((name) => ({
            id: `add-${name}`,
            label: name,
            onSelect: () => {
              emit("addComponent", name);
            },
          }))
      : [{ id: "add-need-entity", label: "Select an entity first", disabled: true, onSelect: () => {} }];

  const panelItems: ContextMenuEntry[] = [
    {
      id: "add-submenu",
      label: "Add",
      disabled: sel === null || !snap,
      children: addChildren,
    },
    {
      id: "paste-components",
      label: "Paste",
      shortcut: "Ctrl+V",
      disabled: sel === null,
      onSelect: () => {
        emit("pasteComponents");
      },
    },
  ];
  open(ev.clientX, ev.clientY, panelItems);
}

function onComponentRowContextMenu(ev: MouseEvent, componentName: string): void {
  const rowItems: ContextMenuItem[] = [
    {
      id: "copy-component",
      label: "Copy",
      shortcut: "Ctrl+C",
      onSelect: () => {
        emit("copyComponent", componentName);
      },
    },
    {
      id: "remove-component",
      label: "Remove",
      danger: true,
      onSelect: () => {
        emit("removeComponent", componentName);
      },
    },
  ];
  open(ev.clientX, ev.clientY, rowItems);
}

function isEditableField(fieldKey: string, value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value) && !isReadonlyResourceField(fieldKey);
}

function keyOf(componentName: string, fieldKey: string): string {
  return `${componentName}.${fieldKey}`;
}

function getEditValue(componentName: string, fieldKey: string, fallback: unknown): string {
  const k = keyOf(componentName, fieldKey);
  if (k in edits) return edits[k];
  if (typeof fallback === "number" && Number.isFinite(fallback)) return String(fallback);
  return "";
}

function formatReadonlyValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return "[object]";
  return String(value);
}

function scheduleApply(payload: { componentName: string; patch: Record<string, unknown> }) {
  lastPayload = payload;
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    rafPending = false;
    if (lastPayload) emit("applyPatch", lastPayload);
    lastPayload = null;
  });
}

function scheduleApplyAny(payload: { componentName: string; patch: Record<string, unknown> }) {
  lastPayload = payload;
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    rafPending = false;
    if (lastPayload) emit("applyPatch", lastPayload);
    lastPayload = null;
  });
}

function onFocus(componentName: string, fieldKey: string): void {
  focusedKey.value = keyOf(componentName, fieldKey);
  emit("editingChanged", true);
}

function onBlur(): void {
  focusedKey.value = null;
  emit("editingChanged", false);
}

function onFieldInput(componentName: string, fieldKey: string, event: Event): void {
  const input = event.target as HTMLInputElement;
  const k = keyOf(componentName, fieldKey);
  edits[k] = input.value;

  const parsed = parseFloat(input.value);
  if (!Number.isFinite(parsed)) return;
  scheduleApply({ componentName, patch: { [fieldKey]: parsed } });
}

function isDescriptorField(compName: string, fieldKey: string): boolean {
  return (compName === "ThreeGeometryRef" || compName === "ThreeMaterialRef") && fieldKey === "descriptor";
}

function isGuidField(compName: string, fieldKey: string): boolean {
  return (compName === "ThreeGeometryRef" || compName === "ThreeMaterialRef") && fieldKey === "guid";
}

function getDescriptor(compName: string, fields: Record<string, unknown>): Record<string, unknown> {
  const v = fields["descriptor"];
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function onDescriptorChange(compName: string, next: Record<string, unknown>): void {
  scheduleApplyAny({ componentName: compName, patch: { descriptor: next } });
}

function onGuidInput(compName: string, event: Event): void {
  const input = event.target as HTMLInputElement;
  scheduleApplyAny({ componentName: compName, patch: { guid: input.value } });
}

function getDescriptorType(desc: Record<string, unknown>): string {
  const t = desc.type;
  return typeof t === "string" ? t : "";
}

/** Keep in sync with `packages/helios-three-plugin/src/builders/descriptors.ts` DEFAULT_GEOMETRY / DEFAULT_MATERIAL */
const GEOMETRY_DEFAULTS: Record<string, Record<string, unknown>> = {
  box: { type: "box", width: 1, height: 1, depth: 1 },
  sphere: { type: "sphere", radius: 1, widthSegments: 32, heightSegments: 16 },
  plane: { type: "plane", width: 1, height: 1, widthSegments: 1, heightSegments: 1 },
  cylinder: { type: "cylinder", radiusTop: 1, radiusBottom: 1, height: 1, radialSegments: 32 },
  cone: { type: "cone", radius: 1, height: 1, radialSegments: 32 },
  torus: { type: "torus", radius: 1, tube: 0.4, radialSegments: 16, tubularSegments: 48 },
};

const MATERIAL_DEFAULTS: Record<string, Record<string, unknown>> = {
  meshBasic: { type: "meshBasic", color: 0xffffff, wireframe: false },
  meshLambert: { type: "meshLambert", color: 0xffffff, wireframe: false, emissive: 0 },
  meshStandard: { type: "meshStandard", color: 0xffffff, roughness: 1, metalness: 0, wireframe: false },
};

function setDescriptorType(compName: string, type: string): void {
  if (compName === "ThreeGeometryRef" && type in GEOMETRY_DEFAULTS) {
    onDescriptorChange(compName, { ...GEOMETRY_DEFAULTS[type]! });
    return;
  }
  if (compName === "ThreeMaterialRef" && type in MATERIAL_DEFAULTS) {
    onDescriptorChange(compName, { ...MATERIAL_DEFAULTS[type]! });
    return;
  }
  onDescriptorChange(compName, { type });
}

function onDescriptorNumberField(compName: string, fields: Record<string, unknown>, key: string, event: Event): void {
  const input = event.target as HTMLInputElement;
  const parsed = parseFloat(input.value);
  if (!Number.isFinite(parsed)) return;
  const desc = { ...getDescriptor(compName, fields), [key]: parsed };
  onDescriptorChange(compName, desc);
}

function onDescriptorBoolField(compName: string, fields: Record<string, unknown>, key: string, event: Event): void {
  const input = event.target as HTMLInputElement;
  const desc = { ...getDescriptor(compName, fields), [key]: input.checked };
  onDescriptorChange(compName, desc);
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

function onDescriptorColorField(compName: string, fields: Record<string, unknown>, key: string, hex: string): void {
  const parsed = hexToColorInt(hex);
  if (parsed === null) return;
  const desc = { ...getDescriptor(compName, fields), [key]: parsed };
  onDescriptorChange(compName, desc);
}

function clampFinite(n: number, fallback: number): number {
  return Number.isFinite(n) ? n : fallback;
}

function getNumericCurrent(componentName: string, fieldKey: string, fallback: unknown): number {
  const k = keyOf(componentName, fieldKey);
  const fromEdits = parseFloat(edits[k] ?? "");
  if (Number.isFinite(fromEdits)) return fromEdits;
  if (typeof fallback === "number" && Number.isFinite(fallback)) return fallback;
  return 0;
}

function getDragStep(event: PointerEvent): number {
  // Base sensitivity. Actual step is made adaptive in onWindowPointerMove.
  const base = 0.02;
  if (event.shiftKey) return base * 0.2;
  if (event.altKey) return base * 8;
  return base;
}

function onLabelPointerDown(
  componentName: string,
  fieldKey: string,
  fallback: unknown,
  event: PointerEvent,
): void {
  if (event.button !== 0) return;
  event.preventDefault();

  drag.active = true;
  drag.pointerId = event.pointerId;
  drag.componentName = componentName;
  drag.fieldKey = fieldKey;
  drag.startClientX = event.clientX;
  drag.lastClientX = event.clientX;
  drag.lastTime = event.timeStamp || performance.now();
  drag.startValue = getNumericCurrent(componentName, fieldKey, fallback);
  drag.lastAppliedValue = drag.startValue;

  focusedKey.value = keyOf(componentName, fieldKey);
  emit("editingChanged", true);

  (event.currentTarget as HTMLElement | null)?.setPointerCapture?.(event.pointerId);
  window.addEventListener("pointermove", onWindowPointerMove, { passive: false });
  window.addEventListener("pointerup", onWindowPointerUp, { passive: false });
  window.addEventListener("pointercancel", onWindowPointerUp, { passive: false });
}

function onWindowPointerMove(event: PointerEvent): void {
  if (!drag.active || event.pointerId !== drag.pointerId) return;
  event.preventDefault();

  const now = event.timeStamp || performance.now();
  const dtMs = Math.max(1, now - drag.lastTime);
  const dxStep = event.clientX - drag.lastClientX; // incremental movement
  drag.lastClientX = event.clientX;
  drag.lastTime = now;

  const baseStep = getDragStep(event);
  // Magnitude scaling: bigger numbers change faster, small numbers remain precise.
  const mag = Math.max(1, Math.abs(drag.lastAppliedValue));
  const magnitudeFactor = 0.02 * mag + 1; // 1 .. grows linearly

  // Speed scaling: faster pointer movement accelerates.
  const pxPerMs = Math.abs(dxStep) / dtMs;
  const speedFactor = Math.min(12, Math.max(0.25, pxPerMs * 6)); // ~0.25..12

  const delta = dxStep * baseStep * magnitudeFactor * speedFactor;
  const next = clampFinite(drag.lastAppliedValue + delta, drag.lastAppliedValue);

  // Keep local input state in sync while dragging.
  edits[keyOf(drag.componentName, drag.fieldKey)] = String(next);

  if (next !== drag.lastAppliedValue) {
    drag.lastAppliedValue = next;
    scheduleApply({ componentName: drag.componentName, patch: { [drag.fieldKey]: next } });
  }
}

function onWindowPointerUp(event: PointerEvent): void {
  if (!drag.active || event.pointerId !== drag.pointerId) return;
  event.preventDefault();

  drag.active = false;
  drag.pointerId = 0;
  drag.componentName = "";
  drag.fieldKey = "";

  focusedKey.value = null;
  emit("editingChanged", false);

  window.removeEventListener("pointermove", onWindowPointerMove as any);
  window.removeEventListener("pointerup", onWindowPointerUp as any);
  window.removeEventListener("pointercancel", onWindowPointerUp as any);
}

watch(
  () => props.snapshot,
  (next) => {
    // Sync non-focused fields from snapshot, but do not overwrite the one being edited.
    if (!next) return;
    for (const [compName, fields] of Object.entries(next.components)) {
      for (const [fieldKey, value] of Object.entries(fields)) {
        const k = keyOf(compName, fieldKey);
        if (focusedKey.value === k) continue;
        if (typeof value === "number" && Number.isFinite(value)) {
          edits[k] = String(value);
        }
      }
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.inspector {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.inspector__header {
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #bbb;
  border-bottom: 1px solid #333;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
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
.inspector__empty {
  padding: 12px 10px;
  font-size: 12px;
  color: #777;
}
.inspector__body {
  overflow: auto;
  flex: 1;
  padding: 8px 10px 12px;
}
.inspector__component {
  margin-bottom: 14px;
}
.inspector__comp-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 0 0 8px;
}
.inspector__comp-title {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  color: #9cf;
  text-transform: none;
}
.inspector__field {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 6px;
  align-items: center;
  margin-bottom: 6px;
  font-size: 11px;
}
.inspector__label {
  color: #888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  user-select: none;
}
.inspector__label--draggable {
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
  word-break: break-word;
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
