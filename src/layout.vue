<template>
  <div class="viewport-layout" :class="`spacing-${spacing}`">
    <div v-if="loading && (!items || items.length === 0)" class="viewport-loading">
      Loading...
    </div>

    <div v-else-if="!items || items.length === 0" class="viewport-empty">
      No items to display
    </div>

    <div v-else class="viewport-table-wrap">
      <table class="viewport-table">
        <thead>
          <tr>
            <th class="checkbox-col">
              <input
                type="checkbox"
                :checked="allSelected"
                :indeterminate="someSelected && !allSelected"
                @change="selectAll"
              />
            </th>
            <th
              v-for="col in visibleFields"
              :key="col.field"
              class="header-cell"
              @click="toggleSort(col.field)"
            >
              <span class="header-label">{{ col.name || col.field }}</span>
              <span v-if="sortField === col.field" class="sort-indicator">
                {{ sortDir === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in items"
            :key="item[pkField]"
            :class="{ 'is-selected': isSelected(item[pkField]) }"
          >
            <td class="checkbox-col">
              <input
                type="checkbox"
                :checked="isSelected(item[pkField])"
                @change="toggleSelection(item[pkField])"
              />
            </td>
            <EditableCell
              v-for="col in visibleFields"
              :key="col.field"
              :value="getCellValue(item, col.field)"
              :field="col.field"
              :field-type="col.type || 'string'"
              :readonly="isReadonly(col)"
              :is-dirty="isCellDirty(item[pkField], col.field)"
              :is-saving="savingKeys.has(item[pkField])"
              @edit="(payload: any) => onCellEdit(item[pkField], payload)"
            />
          </tr>
        </tbody>
      </table>
    </div>

    <div class="viewport-footer" v-if="items && items.length > 0">
      <div class="pagination">
        <button class="page-btn" :disabled="page <= 1" @click="page = page - 1">← Prev</button>
        <span class="page-info">Page {{ page }} of {{ totalPages || 1 }}</span>
        <button class="page-btn" :disabled="page >= (totalPages || 1)" @click="page = page + 1">Next →</button>
      </div>
      <div class="page-size">
        <select :value="limit" @change="limit = Number(($event.target as HTMLSelectElement).value)">
          <option v-for="size in [10, 25, 50, 100]" :key="size" :value="size">{{ size }} / page</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import EditableCell from './editable-cell.vue';

const props = defineProps<{
  collection: string;
  fieldsInfo: any[];
  primaryKeyField: any;
  items: any[];
  loading: boolean;
  totalPages: number;
  itemCount: number;
  totalCount: number;
  page: number;
  limit: number;
  sort: string[];
  fields: string[];
  spacing: 'compact' | 'cozy' | 'comfortable';
  autoSave: boolean;
  autoSaveDelay: number;
  selection: (string | number)[];
  pendingEdits: Map<string | number, Record<string, any>>;
  savingKeys: Set<string | number>;
}>();

const emit = defineEmits<{
  (e: 'update:page', val: number): void;
  (e: 'update:limit', val: number): void;
  (e: 'update:sort', val: string[]): void;
  (e: 'update:selection', val: (string | number)[]): void;
}>();

const directusApi = useApi();

const pkField = computed(() => props.primaryKeyField?.field || 'id');

const readonlyTypes = ['alias', 'json', 'o2m', 'm2m', 'm2a'];

const visibleFields = computed(() => {
  if (!props.fieldsInfo) return [];
  return props.fieldsInfo.filter((f: any) =>
    !f.meta?.hidden && !readonlyTypes.includes(f.type) || f.field === pkField.value
  ).filter((f: any) =>
    props.fields.includes('*') || props.fields.includes(f.field)
  );
});

const sortField = computed(() => {
  if (!props.sort || props.sort.length === 0) return null;
  const s = props.sort[0];
  return s.startsWith('-') ? s.slice(1) : s;
});

const sortDir = computed(() => {
  if (!props.sort || props.sort.length === 0) return null;
  return props.sort[0].startsWith('-') ? 'desc' : 'asc';
});

const page = computed({
  get: () => props.page,
  set: (val) => emit('update:page', val),
});

const limit = computed({
  get: () => props.limit,
  set: (val) => emit('update:limit', val),
});

const allSelected = computed(() => {
  if (!props.items || props.items.length === 0) return false;
  return props.items.every((item: any) => props.selection?.includes(item[pkField.value]));
});

const someSelected = computed(() => {
  if (!props.items || !props.selection) return false;
  return props.items.some((item: any) => props.selection.includes(item[pkField.value]));
});

function isSelected(pk: string | number) {
  return props.selection?.includes(pk) || false;
}

function toggleSelection(pk: string | number) {
  const current = props.selection || [];
  if (current.includes(pk)) {
    emit('update:selection', current.filter((k) => k !== pk));
  } else {
    emit('update:selection', [...current, pk]);
  }
}

function selectAll() {
  if (!props.items) return;
  if (allSelected.value) {
    emit('update:selection', []);
  } else {
    emit('update:selection', props.items.map((item: any) => item[pkField.value]));
  }
}

function toggleSort(field: string) {
  const current = props.sort || [];
  if (current.length > 0 && current[0] === field) {
    emit('update:sort', [`-${field}`]);
  } else if (current.length > 0 && current[0] === `-${field}`) {
    emit('update:sort', []);
  } else {
    emit('update:sort', [field]);
  }
}

function getCellValue(item: any, field: string) {
  const pk = item[pkField.value];
  const pending = props.pendingEdits.get(pk);
  if (pending && field in pending) return pending[field];
  return item[field];
}

function isReadonly(col: any) {
  if (col.field === pkField.value) return true;
  if (col.schema?.is_generated) return true;
  if (readonlyTypes.includes(col.type)) return true;
  return false;
}

function isCellDirty(pk: string | number, field: string) {
  const pending = props.pendingEdits.get(pk);
  return pending ? field in pending : false;
}

// Debounce timer
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function onCellEdit(pk: string | number, payload: { field: string; value: any }) {
  const current = props.pendingEdits.get(pk) || {};
  current[payload.field] = payload.value;
  props.pendingEdits.set(pk, current);

  if (props.autoSave) {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => flushEdits(), props.autoSaveDelay);
  }
}

async function flushEdits() {
  if (!directusApi || props.pendingEdits.size === 0) return;

  const entries = Array.from(props.pendingEdits.entries());
  for (const [pk, edits] of entries) {
    props.savingKeys.add(pk);
    try {
      await directusApi.patch(`/items/${props.collection}/${pk}`, edits);
      props.pendingEdits.delete(pk);
    } catch (err) {
      console.error(`[viewport] Failed to save item ${pk}:`, err);
    } finally {
      props.savingKeys.delete(pk);
    }
  }
}

// Expose flushEdits for manual save from actions
defineExpose({ flushEdits });
</script>

<style scoped>
.viewport-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  font-size: 14px;
  color: var(--theme--foreground, #333);
}

.viewport-loading,
.viewport-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--theme--foreground-subdued, #999);
  font-size: 16px;
}

.viewport-table-wrap {
  flex: 1;
  overflow: auto;
}

.viewport-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
  color: var(--theme--foreground, #171717);
}

.viewport-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

.viewport-table th {
  background: var(--theme--background-accent, #f5f5f5);
  padding: 0 8px;
  text-align: left;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  color: var(--theme--foreground-subdued, #999);
  border-bottom: 2px solid var(--theme--border-color, #e0e0e0);
  border-right: 1px solid var(--theme--border-color, #e0e0e0);
  user-select: none;
  white-space: nowrap;
  cursor: pointer;
}

.header-cell:hover {
  color: var(--theme--foreground, #333);
}

.header-label {
  margin-right: 4px;
}

.sort-indicator {
  font-size: 10px;
}

.checkbox-col {
  width: 40px;
  text-align: center;
  padding: 0 4px;
  border-right: 1px solid var(--theme--border-color, #e0e0e0);
  border-bottom: 1px solid var(--theme--border-color, #e0e0e0);
}

thead .checkbox-col {
  background: var(--theme--background-accent, #f5f5f5);
  border-bottom: 2px solid var(--theme--border-color, #e0e0e0);
}

.viewport-table tbody tr:hover {
  background: var(--theme--background-accent, rgba(0, 0, 0, 0.02));
}

.viewport-table tbody tr.is-selected {
  background: color-mix(in srgb, var(--theme--primary, #6644ff) 8%, transparent);
}

/* Spacing modes */
.spacing-compact .viewport-table th,
.spacing-compact .viewport-table td,
.spacing-compact .checkbox-col {
  height: 32px;
  line-height: 32px;
}

.spacing-cozy .viewport-table th,
.spacing-cozy .viewport-table td,
.spacing-cozy .checkbox-col {
  height: 48px;
  line-height: 48px;
}

.spacing-comfortable .viewport-table th,
.spacing-comfortable .viewport-table td,
.spacing-comfortable .checkbox-col {
  height: 64px;
  line-height: 64px;
}

/* Footer */
.viewport-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-top: 1px solid var(--theme--border-color, #e0e0e0);
  background: var(--theme--background, #fff);
  flex-shrink: 0;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-btn {
  padding: 4px 10px;
  border: 1px solid var(--theme--border-color, #e0e0e0);
  border-radius: var(--theme--border-radius, 4px);
  background: var(--theme--background, #fff);
  color: var(--theme--foreground, #333);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s;
}

.page-btn:hover:not(:disabled) {
  background: var(--theme--background-accent, #f5f5f5);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: var(--theme--foreground-subdued, #999);
}

.page-size select {
  padding: 4px 8px;
  border: 1px solid var(--theme--border-color, #e0e0e0);
  border-radius: var(--theme--border-radius, 4px);
  background: var(--theme--background, #fff);
  color: var(--theme--foreground, #333);
  font-size: 13px;
}
</style>
