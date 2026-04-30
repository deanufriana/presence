<template>
  <ConfirmModal
    :model-value="modelValue"
    title="Sync & Merge Data?"
    confirm-text="Sync & Merge"
    @update:model-value="$emit('update:modelValue', $event)"
    @confirm="$emit('confirm')"
  >
    <template #icon>
      <RefreshCw class="h-6 w-6 animate-spin-slow" />
    </template>
    Fresh activities from GitLab and Calendar will replace your existing report data for this month.
    Any manual edits for the synced dates will be overwritten.
  </ConfirmModal>
</template>

<script setup lang="ts">
import { RefreshCw } from 'lucide-vue-next'
import ConfirmModal from './ConfirmModal.vue'

defineProps<{
  modelValue: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
}>()
</script>
