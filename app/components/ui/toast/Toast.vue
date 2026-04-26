<script setup lang="ts">
import {
  ToastRoot,
  type ToastRootEmits,
  type ToastRootProps,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
  ToastViewport,
  useForwardPropsEmits,
} from 'reka-ui'
import { X, CheckCircle2, AlertCircle, Info, Loader2 } from 'lucide-vue-next'
import { computed } from 'vue'

interface Props extends ToastRootProps {
  variant?: 'default' | 'destructive' | 'success' | 'info' | 'loading'
  title?: string
  description?: string
}

const props = withDefaults(defineProps<Props>(), {
  duration: 5000
})
const emits = defineEmits<ToastRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)

const variantClass = computed(() => {
  switch (props.variant) {
    case 'destructive': return 'bg-destructive text-destructive-foreground border-destructive/50'
    case 'success': return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-400 border-emerald-500/20'
    case 'info': return 'bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-400 border-blue-500/20'
    default: return 'bg-background text-foreground border-border'
  }
})
</script>

<template>
  <ToastRoot
    v-bind="forwarded"
    :class="[
      'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-xl border p-4 pr-8 shadow-lg transition-all',
      'data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
      variantClass
    ]"
  >
    <div class="flex gap-3 items-start">
      <div v-if="variant === 'success'" class="mt-0.5">
        <CheckCircle2 class="h-5 w-5 text-emerald-500" />
      </div>
      <div v-else-if="variant === 'destructive'" class="mt-0.5">
        <AlertCircle class="h-5 w-5 text-destructive-foreground" />
      </div>
      <div v-else-if="variant === 'info'" class="mt-0.5">
        <Info class="h-5 w-5 text-blue-500" />
      </div>
      <div v-else-if="variant === 'loading'" class="mt-0.5">
        <Loader2 class="h-5 w-5 text-primary animate-spin" />
      </div>

      <div class="grid gap-1">
        <ToastTitle v-if="title" class="text-sm font-semibold">
          {{ title }}
        </ToastTitle>
        <ToastDescription v-if="description" class="text-xs opacity-90 leading-relaxed">
          {{ description }}
        </ToastDescription>
      </div>
    </div>

    <ToastClose
      class="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
    >
      <X class="h-4 w-4" />
    </ToastClose>
  </ToastRoot>
</template>
