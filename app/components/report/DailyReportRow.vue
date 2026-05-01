<template>
  <div class="flex-1 min-h-[60px] transition-all duration-300 rounded-xl">
    <div
      :class="{
        'animate-pulse opacity-50': isSummarizing,
        'ring-1 ring-violet-500/20 rounded-xl': isSyncing,
      }"
      class="transition-all duration-500"
    >
      <draggable
        v-if="localActivities.length > 0"
        v-model="localActivities"
        group="activities"
        handle=".drag-handle"
        item-key="id"
        class="space-y-2 min-h-[40px]"
        animation="200"
        ghost-class="opacity-20"
        @change="onDraggableChange"
      >
        <template #item="{ element: item }">
          <div
            class="group/item flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/30 border border-transparent hover:border-violet-500/20 hover:bg-violet-500/5 transition-all relative"
          >
            <GripVertical
              v-once
              class="drag-handle h-3.5 w-3.5 text-muted-foreground/30 group-hover/item:text-violet-500/50 mt-1 shrink-0 transition-colors cursor-grab active:cursor-grabbing"
            />
            <div
              v-if="!/^[-*•]/.test(item.text)"
              class="h-2 w-2 rounded-full bg-violet-400 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(167,139,250,0.5)]"
            />
            <span class="flex-1 text-sm leading-relaxed text-foreground/90">{{ item.text }}</span>
            <button
              class="opacity-0 group-hover/item:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0"
              title="Remove item"
              @click.stop="deleteItem(item.text)"
            >
              <Trash2 v-once class="h-3.5 w-3.5" />
            </button>
          </div>
        </template>
      </draggable>
      <div
        v-else
        class="h-full flex items-center text-muted-foreground/40 italic text-xs py-4 px-2 rounded-xl border border-dashed border-border/50"
      >
        No activities logged for this day. Click sync or add manually.
      </div>

      <!-- Add Activity Inline -->
      <div
        v-if="isAdding"
        class="mt-3 flex gap-2 animate-in fade-in slide-in-from-top-2 duration-300"
      >
        <Input
          ref="addInputRef"
          v-model="newActivityText"
          placeholder="Describe your activity..."
          class="h-9 text-xs bg-muted/20 border-violet-500/30 focus-visible:ring-violet-500/30"
          @keyup.enter="confirmAdd"
          @keyup.esc="cancelAdding"
        />
        <Button size="xs" variant="gradient" @click="confirmAdd">
          <Check v-once class="h-3.5 w-3.5" />
        </Button>
        <Button size="xs" variant="ghost" @click="cancelAdding">
          <X v-once class="h-3.5 w-3.5" />
        </Button>
      </div>
      <Button
        v-else
        variant="ghost"
        class="w-full h-auto py-2 px-3 mt-3 rounded-xl border border-dashed border-border/50 text-muted-foreground hover:text-violet-500 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all group/add"
        @click="startAdding"
      >
        <Plus
          v-once
          class="h-3.5 w-3.5 group-hover/add:rotate-90 transition-transform duration-300"
        />
        <span class="text-[10px] font-bold uppercase tracking-wider">Add Activity</span>
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import { GripVertical, Trash2, Check, X, Plus } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import type { ReportRow } from '~/types/report'
import { useDailyStore } from '~/stores/daily'
import { useToast } from '~/composables/use-toast'
import { useDebounceFn } from '@vueuse/core'

interface ActivityItem {
  id: string
  text: string
}

const props = defineProps<{
  row: ReportRow
  isSummarizing?: boolean
  isSyncing?: boolean
}>()

const dailyStore = useDailyStore()
const { success } = useToast()

const localActivities = shallowRef<ActivityItem[]>([])
const isAdding = ref(false)
const newActivityText = ref('')

// Initialize local activities from row.aktivitas string
const parseActivities = (text: string): ActivityItem[] => {
  if (!text) return []
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((text, idx) => ({
      id: `${props.row.date}-${idx}-${text.substring(0, 10)}`,
      text,
    }))
}

// Watch for changes in row.aktivitas to sync local state
watch(
  () => props.row.aktivitas,
  (newText) => {
    const currentTexts = localActivities.value.map((a) => a.text).join('\n')
    if (newText !== currentTexts) {
      localActivities.value = parseActivities(newText)
    }
  },
  { immediate: true },
)

interface DraggableEvent {
  added?: { element: ActivityItem; newIndex: number }
  removed?: { element: ActivityItem; oldIndex: number }
  moved?: { element: ActivityItem; oldIndex: number; newIndex: number }
}

const debouncedUpdate = useDebounceFn(async (newText: string) => {
  if (newText !== props.row.aktivitas) {
    const updatedRow = { ...props.row, aktivitas: newText }
    await dailyStore.updateRow(updatedRow)
  }
}, 1000)

const onDraggableChange = async (event: DraggableEvent) => {
  const newText = localActivities.value.map((a) => a.text).join('\n')
  debouncedUpdate(newText)

  if (event.added) {
    success(`Moved activity to ${props.row.date}`)
  } else if (event.moved) {
    success('Reordered activity')
  }
}

const deleteItem = async (text: string) => {
  localActivities.value = localActivities.value.filter((i) => i.text !== text)
  const newText = localActivities.value.map((a) => a.text).join('\n')
  const updatedRow = { ...props.row, aktivitas: newText }
  await dailyStore.updateRow(updatedRow)
  success(`Removed activity from ${props.row.date}`)
}

const addInputRef = ref<ComponentPublicInstance | null>(null)

const startAdding = () => {
  isAdding.value = true
  newActivityText.value = ''
  nextTick(() => {
    const input = addInputRef.value?.$el as HTMLInputElement
    if (input) {
      input.focus()
      input.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
}

const cancelAdding = () => {
  isAdding.value = false
  newActivityText.value = ''
}

const confirmAdd = async () => {
  const text = newActivityText.value.trim()
  if (!text) {
    cancelAdding()
    return
  }

  const newItem: ActivityItem = {
    id: `${props.row.date}-${Date.now()}-${text.substring(0, 5)}`,
    text,
  }

  localActivities.value = [...localActivities.value, newItem]
  const newText = localActivities.value.map((a) => a.text).join('\n')
  const updatedRow = { ...props.row, aktivitas: newText }
  await dailyStore.updateRow(updatedRow)

  success('Activity added')
  cancelAdding()
}
</script>
