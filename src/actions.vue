<template>
  <div class="viewport-actions">
    <span class="item-count" v-if="itemCount !== null && totalCount !== null">
      {{ rangeStart }}-{{ rangeEnd }} of {{ totalCount }}
    </span>
    <button
      v-if="!autoSave && hasPending"
      class="save-btn"
      @click="$emit('save')"
    >
      Save Changes
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  itemCount: number | null;
  totalCount: number | null;
  page: number;
  limit: number;
  autoSave: boolean;
  hasPending: boolean;
}>();

defineEmits<{
  (e: 'save'): void;
}>();

const rangeStart = computed(() => (props.page - 1) * props.limit + 1);
const rangeEnd = computed(() => {
  const end = props.page * props.limit;
  return props.totalCount !== null ? Math.min(end, props.totalCount) : end;
});
</script>

<style scoped>
.viewport-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-count {
  font-size: 14px;
  color: var(--theme--foreground-subdued, #999);
}

.save-btn {
  padding: 4px 12px;
  border: none;
  border-radius: var(--theme--border-radius, 4px);
  background: var(--theme--primary, #6644ff);
  color: var(--theme--primary-foreground, #fff);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: opacity 0.15s;
}

.save-btn:hover {
  opacity: 0.85;
}
</style>
