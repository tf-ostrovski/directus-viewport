<template>
  <div class="viewport-options">
    <div class="option-group">
      <div class="option-label">Row Spacing</div>
      <div class="option-buttons">
        <button
          v-for="opt in spacingOptions"
          :key="opt.value"
          class="spacing-btn"
          :class="{ active: spacing === opt.value }"
          @click="spacing = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <div class="option-group">
      <div class="option-label">Auto-Save</div>
      <label class="toggle-row">
        <input type="checkbox" v-model="autoSave" />
        <span>{{ autoSave ? 'Enabled' : 'Disabled' }}</span>
      </label>
    </div>

    <div v-if="autoSave" class="option-group">
      <div class="option-label">Save Delay (ms)</div>
      <input
        type="number"
        class="delay-input"
        :value="autoSaveDelay"
        min="200"
        max="10000"
        step="100"
        @change="autoSaveDelay = Number(($event.target as HTMLInputElement).value)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { LayoutOptions } from './types';

const props = defineProps<{
  layoutOptions: LayoutOptions | null;
}>();

const emit = defineEmits<{
  (e: 'update:layoutOptions', value: LayoutOptions): void;
}>();

const spacingOptions = [
  { label: 'Compact', value: 'compact' as const },
  { label: 'Cozy', value: 'cozy' as const },
  { label: 'Comfortable', value: 'comfortable' as const },
];

const spacing = computed({
  get: () => props.layoutOptions?.spacing || 'cozy',
  set: (val) => emit('update:layoutOptions', { ...props.layoutOptions, spacing: val, autoSave: autoSave.value, autoSaveDelay: autoSaveDelay.value }),
});

const autoSave = computed({
  get: () => props.layoutOptions?.autoSave !== false,
  set: (val) => emit('update:layoutOptions', { ...props.layoutOptions, spacing: spacing.value, autoSave: val, autoSaveDelay: autoSaveDelay.value }),
});

const autoSaveDelay = computed({
  get: () => props.layoutOptions?.autoSaveDelay || 1000,
  set: (val) => emit('update:layoutOptions', { ...props.layoutOptions, spacing: spacing.value, autoSave: autoSave.value, autoSaveDelay: val }),
});
</script>

<style scoped>
.viewport-options {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.option-label {
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  color: var(--theme--foreground-subdued, #999);
}

.option-buttons {
  display: flex;
  gap: 4px;
}

.spacing-btn {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid var(--theme--border-color, #e0e0e0);
  border-radius: var(--theme--border-radius, 4px);
  background: var(--theme--background, #fff);
  color: var(--theme--foreground, #333);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.15s;
}

.spacing-btn.active {
  background: var(--theme--primary, #6644ff);
  color: var(--theme--primary-foreground, #fff);
  border-color: var(--theme--primary, #6644ff);
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--theme--foreground, #333);
}

.delay-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid var(--theme--border-color, #e0e0e0);
  border-radius: var(--theme--border-radius, 4px);
  background: var(--theme--background, #fff);
  color: var(--theme--foreground, #333);
  font-size: 14px;
}
</style>
