<template>
  <AlertDialog :open="modelValue" @update:open="$emit('update:modelValue', $event)">
    <AlertDialogContent
      class="w-full max-w-[400px] overflow-hidden p-0"
      :class="variant === 'destructive' ? 'border-red-500/20' : 'border-violet-500/20'"
    >
      <div :class="['h-1.5 w-full', variant === 'destructive' ? 'bg-red-500' : 'bg-violet-500']" />
      <AlertDialogHeader class="p-6 pb-2">
        <div
          :class="[
            'flex items-center gap-3 mb-2',
            variant === 'destructive' ? 'text-red-600' : 'text-violet-600',
          ]"
        >
          <div
            :class="[
              'size-10 rounded-full flex items-center justify-center',
              variant === 'destructive' ? 'bg-red-50' : 'bg-violet-50',
            ]"
          >
            <slot name="icon" />
          </div>
          <AlertDialogTitle class="text-xl">{{ title }}</AlertDialogTitle>
        </div>
        <AlertDialogDescription class="text-balance text-left text-muted-foreground">
          <slot>{{ description }}</slot>
        </AlertDialogDescription>
      </AlertDialogHeader>

      <AlertDialogFooter class="flex flex-col sm:flex-row gap-2 p-6 pt-4">
        <AlertDialogCancel class="w-full sm:flex-1 mt-0" @click="$emit('update:modelValue', false)">
          {{ cancelText }}
        </AlertDialogCancel>
        <AlertDialogAction
          class="w-full sm:flex-1 text-white border-0"
          :class="
            variant === 'destructive'
              ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
              : 'bg-violet-600 hover:bg-violet-700 focus:ring-violet-500'
          "
          @click="$emit('confirm')"
        >
          {{ confirmText }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
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

withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    description?: string
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'destructive'
  }>(),
  {
    description: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'default',
  },
)

defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
}>()
</script>
