<template>
  <td
    class="viewport-cell"
    :class="{ 'is-dirty': isDirty, 'is-saving': isSaving, 'is-readonly': readonly }"
    @click="startEdit"
  >
    <div v-if="editing" class="cell-editor">
      <input
        ref="inputEl"
        v-model="editValue"
        class="cell-input"
        :type="inputType"
        @blur="commitEdit"
        @keydown.enter="commitEdit"
        @keydown.escape="cancelEdit"
      />
    </div>
    <div v-else class="cell-display" :title="displayValue">
      <span v-if="isSaving" class="saving-dot"></span>
      {{ displayValue }}
    </div>
  </td>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';

const props = defineProps<{
  value: any;
  field: string;
  fieldType: string;
  readonly?: boolean;
  isDirty?: boolean;
  isSaving?: boolean;
}>();

const emit = defineEmits<{
  (e: 'edit', payload: { field: string; value: any }): void;
}>();

const editing = ref(false);
const editValue = ref<string>('');
const inputEl = ref<HTMLInputElement | null>(null);

const readonly_types = ['alias', 'json', 'o2m', 'm2m', 'm2a'];

const inputType = computed(() => {
  if (['integer', 'bigInteger'].includes(props.fieldType)) return 'number';
  if (['float', 'decimal'].includes(props.fieldType)) return 'number';
  return 'text';
});

const displayValue = computed(() => {
  if (props.value === null || props.value === undefined) return '';
  if (typeof props.value === 'boolean') return props.value ? 'true' : 'false';
  if (typeof props.value === 'object') return JSON.stringify(props.value);
  return String(props.value);
});

function startEdit() {
  if (props.readonly || readonly_types.includes(props.fieldType)) return;
  editing.value = true;
  editValue.value = displayValue.value;
  nextTick(() => {
    inputEl.value?.focus();
    inputEl.value?.select();
  });
}

function coerceValue(raw: string): any {
  if (raw === '') return null;
  if (['integer', 'bigInteger'].includes(props.fieldType)) {
    const n = parseInt(raw, 10);
    return isNaN(n) ? null : n;
  }
  if (['float', 'decimal'].includes(props.fieldType)) {
    const n = parseFloat(raw);
    return isNaN(n) ? null : n;
  }
  if (props.fieldType === 'boolean') {
    return raw === 'true' || raw === '1';
  }
  return raw;
}

function valuesEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;
  // Compare by string representation to avoid type mismatch (e.g. 5 vs "5")
  return String(a) === String(b);
}

function commitEdit() {
  if (!editing.value) return;
  editing.value = false;
  const coerced = coerceValue(editValue.value);
  if (!valuesEqual(coerced, props.value)) {
    emit('edit', { field: props.field, value: coerced });
  }
}

function cancelEdit() {
  editing.value = false;
}
</script>

<style scoped>
.viewport-cell {
  padding: 0 8px;
  cursor: default;
  border-right: 1px solid var(--theme--border-color, #e0e0e0);
  border-bottom: 1px solid var(--theme--border-color, #e0e0e0);
  position: relative;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--theme--foreground, #171717);
}

.viewport-cell:not(.is-readonly):hover {
  background: var(--theme--background-accent, rgba(255, 255, 255, 0.05));
  cursor: text;
}

.viewport-cell.is-dirty {
  background: color-mix(in srgb, var(--theme--warning, #ffc107) 15%, transparent);
}

.viewport-cell.is-saving {
  opacity: 0.7;
}

.cell-editor {
  width: 100%;
  height: 100%;
}

.cell-input {
  width: 100%;
  height: 100%;
  border: none;
  background: var(--theme--form--field--input--background, transparent);
  color: var(--theme--foreground, inherit);
  font: inherit;
  padding: 0;
  outline: none;
  box-shadow: inset 0 0 0 2px var(--theme--primary, #6644ff);
  border-radius: 2px;
}

.cell-display {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.saving-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--theme--primary, #6644ff);
  animation: pulse 0.8s infinite alternate;
  flex-shrink: 0;
}

@keyframes pulse {
  from { opacity: 0.3; }
  to { opacity: 1; }
}
</style>
