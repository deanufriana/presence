<template>
  <AlertDialog :open="modelValue" @update:open="$emit('update:modelValue', $event)">
    <AlertDialogContent class="w-full max-w-[400px] overflow-hidden p-0 border-violet-500/20">
      <div class="h-1.5 w-full bg-violet-500" />
      <AlertDialogHeader class="p-6 pb-2">
        <div class="flex items-center gap-3 mb-2 text-violet-600">
          <div class="size-10 rounded-full flex items-center justify-center bg-violet-50">
            <RefreshCw class="size-6 animate-spin-slow" />
          </div>
          <AlertDialogTitle class="text-xl">Sync & Merge Data?</AlertDialogTitle>
        </div>
        <AlertDialogDescription class="text-balance text-left text-muted-foreground">
          Fresh activities from GitLab and Calendar will replace your existing report data for this
          month. Any manual edits for the synced dates will be overwritten.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <AlertDialogFooter class="flex flex-col sm:flex-row gap-2 p-6 pt-4">
        <AlertDialogCancel class="w-full sm:flex-1 mt-0" @click="$emit('update:modelValue', false)">
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction
          class="w-full sm:flex-1 text-white border-0 bg-violet-600 hover:bg-violet-700 focus:ring-violet-500"
          @click="$emit('confirm')"
        >
          Sync & Merge
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
import { RefreshCw } from 'lucide-vue-next'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '~/components/ui/alert-dialog'

defineProps<{
  modelValue: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
}>()
</script>
