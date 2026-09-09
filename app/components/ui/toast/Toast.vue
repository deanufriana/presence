<script setup lang="ts">
import {
  ToastRoot,
  type ToastRootEmits,
  type ToastRootProps,
  ToastTitle,
  ToastDescription,
  ToastClose,
  useForwardPropsEmits,
} from 'reka-ui'
import { X, CheckCircle2, AlertCircle, Info, Loader2, Copy, Check } from 'lucide-vue-next'
import { computed, ref } from 'vue'

interface Props extends ToastRootProps {
  variant?: 'default' | 'destructive' | 'success' | 'info' | 'loading'
  title?: string
  description?: string
  copyable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  duration: 5000,
  variant: 'default',
  title: undefined,
  description: undefined,
  copyable: undefined,
})
const emits = defineEmits<ToastRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)

const copied = ref(false)

const showCopyButton = computed(() => {
  if (props.copyable !== undefined) return props.copyable
  return props.variant === 'destructive' && (!!props.description || !!props.title)
})

async function copyErrorDetail() {
  const textToCopy = props.description
    ? props.title
      ? `${props.title}\n${props.description}`
      : props.description
    : props.title || ''

  if (!textToCopy) return

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(textToCopy)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = textToCopy
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      textarea.style.top = '-9999px'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy toast error detail:', err)
  }
}

const variantClass = computed(() => {
  switch (props.variant) {
    case 'destructive':
      return 'bg-destructive text-destructive-foreground border-destructive/50'
    case 'success':
      return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-400 border-emerald-500/20'
    case 'info':
      return 'bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-400 border-blue-500/20'
    default:
      return 'bg-background text-foreground border-border'
  }
})
</script>

<template>
  <ToastRoot
    v-bind="forwarded"
    :class="[
      'group pointer-events-auto relative flex w-full items-start justify-between space-x-3 overflow-hidden rounded-xl border p-4 pr-8 shadow-lg transition-all',
      'data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
      variantClass,
    ]"
  >
    <div class="flex gap-3 items-start flex-1 min-w-0">
      <div v-if="variant === 'success'" class="mt-0.5 shrink-0">
        <CheckCircle2 class="h-5 w-5 text-emerald-500" />
      </div>
      <div v-else-if="variant === 'destructive'" class="mt-0.5 shrink-0">
        <AlertCircle class="h-5 w-5 text-destructive-foreground" />
      </div>
      <div v-else-if="variant === 'info'" class="mt-0.5 shrink-0">
        <Info class="h-5 w-5 text-blue-500" />
      </div>
      <div v-else-if="variant === 'loading'" class="mt-0.5 shrink-0">
        <Loader2 class="h-5 w-5 text-primary animate-spin" />
      </div>

      <div class="grid gap-1.5 flex-1 min-w-0">
        <ToastTitle v-if="title" class="text-sm font-semibold leading-tight break-words">
          {{ title }}
        </ToastTitle>
        <ToastDescription
          v-if="description"
          :class="[
            'text-xs leading-relaxed break-words',
            variant === 'destructive'
              ? 'font-mono text-[11px] bg-black/20 dark:bg-white/10 px-2 py-1.5 rounded border border-white/10 max-h-36 overflow-y-auto select-text'
              : 'opacity-90',
          ]"
        >
          {{ description }}
        </ToastDescription>

        <div v-if="showCopyButton" class="pt-1 flex items-center">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer select-none bg-black/20 hover:bg-black/30 dark:bg-white/15 dark:hover:bg-white/25 text-inherit border border-white/15"
            :title="copied ? 'Detail error tersalin ke clipboard' : 'Salin detail error'"
            @click.stop="copyErrorDetail"
          >
            <component :is="copied ? Check : Copy" class="h-3 w-3" />
            <span>{{ copied ? 'Tersalin!' : 'Salin Detail Error' }}</span>
          </button>
        </div>
      </div>
    </div>

    <ToastClose
      class="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
    >
      <X class="h-4 w-4" />
    </ToastClose>
  </ToastRoot>
</template>
