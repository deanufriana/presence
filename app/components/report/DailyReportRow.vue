<template>
  <div class="flex-1 min-h-[60px] transition-all duration-300 rounded-xl">
    <div
      :class="{
        'animate-pulse opacity-50': isSummarizing,
        'ring-1 ring-violet-500/20 rounded-xl': isSyncing,
      }"
      class="transition-all duration-500"
    >
      <div class="relative min-h-[44px]">
        <draggable
          v-model="localActivities"
          group="activities"
          handle=".drag-handle"
          item-key="id"
          class="space-y-2 min-h-[44px] rounded-xl p-0.5"
          animation="200"
          ghost-class="opacity-20"
          @change="onDraggableChange"
        >
          <template #item="{ element: item, index }">
            <div
              class="group/item flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/30 border border-transparent hover:border-violet-500/20 hover:bg-violet-500/5 transition-all relative"
            >
              <GripVertical
                v-once
                class="drag-handle size-3.5 text-muted-foreground/30 group-hover/item:text-violet-500/50 mt-1 shrink-0 transition-colors cursor-grab active:cursor-grabbing"
              />
              <div
                v-if="!parseActivityDisplay(item.text).project && !/^[-*•]/.test(item.text)"
                class="size-2 rounded-full bg-violet-400 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(167,139,250,0.5)]"
              />
              <div
                class="flex-1 min-w-0 flex items-start gap-1.5 flex-wrap text-sm leading-relaxed text-foreground/90 break-words"
              >
                <span
                  v-if="parseActivityDisplay(item.text).project"
                  class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 shrink-0 select-none leading-none mt-0.5"
                >
                  {{ parseActivityDisplay(item.text).project }}
                </span>
                <span
                  v-if="parseActivityDisplay(item.text).jira"
                  class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 shrink-0 select-none leading-none mt-0.5"
                >
                  {{ parseActivityDisplay(item.text).jira }}
                </span>
                <span class="inline leading-relaxed">{{
                  parseActivityDisplay(item.text).cleanText
                }}</span>
              </div>

              <div
                class="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0"
              >
                <!-- Move Popover -->
                <Popover v-model:open="openPopoverPerItem[item.id]">
                  <PopoverTrigger as-child>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="size-7 rounded-lg text-muted-foreground hover:text-violet-500 hover:bg-violet-500/10 transition-all"
                      title="Move activity"
                      @click.stop
                    >
                      <ArrowRightLeft class="size-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-72 p-3 z-50" align="end" @click.stop>
                    <div class="space-y-3">
                      <!-- Header -->
                      <div class="flex items-center justify-between border-b border-border/40 pb-2">
                        <span class="text-xs font-bold flex items-center gap-1.5 text-foreground">
                          <ArrowRightLeft class="size-3.5 text-violet-500" />
                          Move Activity
                        </span>
                        <span class="text-[10px] font-semibold text-muted-foreground tabular-nums">
                          {{ formattedCurrentDate }}
                        </span>
                      </div>

                      <!-- Quick Shift -->
                      <div>
                        <div
                          class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5"
                        >
                          Quick Shift
                        </div>
                        <div class="grid grid-cols-2 gap-1.5">
                          <Button
                            variant="outline"
                            size="xs"
                            class="h-8 justify-start text-[11px] font-medium"
                            :disabled="!canMovePrev"
                            @click="moveToPrev(item.text, item.id)"
                          >
                            <ArrowLeft class="size-3 shrink-0" data-icon="inline-start" />
                            <span class="truncate">{{ prevDateLabel }}</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="xs"
                            class="h-8 justify-between text-[11px] font-medium"
                            :disabled="!canMoveNext"
                            @click="moveToNext(item.text, item.id)"
                          >
                            <span class="truncate">{{ nextDateLabel }}</span>
                            <ArrowRight class="size-3 shrink-0" data-icon="inline-end" />
                          </Button>
                        </div>
                      </div>

                      <!-- Reorder in Day (if >1 items) -->
                      <div v-if="localActivities.length > 1">
                        <div
                          class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5"
                        >
                          Reorder in Day
                        </div>
                        <div class="grid grid-cols-2 gap-1.5">
                          <Button
                            variant="outline"
                            size="xs"
                            class="h-8 text-[11px] font-medium"
                            :disabled="index === 0"
                            @click="moveUp(index, item.id)"
                          >
                            <ArrowUp class="size-3" data-icon="inline-start" />
                            Move Up
                          </Button>
                          <Button
                            variant="outline"
                            size="xs"
                            class="h-8 text-[11px] font-medium"
                            :disabled="index === localActivities.length - 1"
                            @click="moveDown(index, item.id)"
                          >
                            <ArrowDown class="size-3" data-icon="inline-start" />
                            Move Down
                          </Button>
                        </div>
                      </div>

                      <!-- Move to Specific Date -->
                      <div>
                        <div
                          class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5"
                        >
                          Move to Date
                        </div>
                        <div class="flex gap-1.5">
                          <Select v-model="targetDatePerItem[item.id]">
                            <SelectTrigger class="h-8 flex-1 text-xs">
                              <SelectValue placeholder="Choose day..." />
                            </SelectTrigger>
                            <SelectContent class="max-h-56 z-50">
                              <SelectItem
                                v-for="d in availableMonthDates"
                                :key="d.date"
                                :value="d.date"
                                class="text-xs"
                              >
                                {{ d.label }}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="gradient"
                            size="xs"
                            class="h-8 px-2.5 text-xs shrink-0"
                            :disabled="!targetDatePerItem[item.id]"
                            @click="moveToSpecific(item.text, item.id)"
                          >
                            Move
                          </Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <!-- Delete Button -->
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-7 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0"
                  title="Remove item"
                  @click.stop="deleteItem(item.text)"
                >
                  <Trash2 class="size-3.5" />
                </Button>
              </div>
            </div>
          </template>
        </draggable>

        <!-- Empty state placeholder (non-interactive so it never blocks drops) -->
        <div
          v-if="localActivities.length === 0"
          class="pointer-events-none absolute inset-0 flex items-center justify-center text-muted-foreground/40 italic text-xs py-3 px-2 rounded-xl border border-dashed border-border/50 select-none text-center"
        >
          No activities logged. Drag here, click sync, or add below.
        </div>
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
          <Check v-once />
        </Button>
        <Button size="xs" variant="ghost" @click="cancelAdding">
          <X v-once />
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
          class="group-hover/add:rotate-90 transition-transform duration-300"
          data-icon="inline-start"
        />
        <span class="text-[10px] font-bold uppercase tracking-wider">Add Activity</span>
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import {
  GripVertical,
  Trash2,
  Check,
  X,
  Plus,
  ArrowRightLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
} from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import type { ReportRow } from '~/types/report'
import { useDailyStore } from '~/stores/daily'
import { useToast } from '~/composables/use-toast'
import { format, parseISO, addDays, subDays, getDaysInMonth, setDate } from 'date-fns'

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
const openPopoverPerItem = ref<Record<string, boolean>>({})
const targetDatePerItem = ref<Record<string, string>>({})

// Initialize local activities preserving IDs across updates
const parseActivities = (text: string, existing: ActivityItem[] = []): ActivityItem[] => {
  if (!text) return []
  const lines = text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

  const pool = [...existing]
  return lines.map((line) => {
    const idx = pool.findIndex((item) => item.text === line)
    if (idx !== -1) {
      const [matched] = pool.splice(idx, 1)
      if (matched) return matched
    }
    return {
      id: `${props.row.date}-${Math.random().toString(36).slice(2, 9)}`,
      text: line,
    }
  })
}

interface ParsedActivityDisplay {
  project?: string
  jira?: string
  cleanText: string
}

const displayCache = new Map<string, ParsedActivityDisplay>()

const parseActivityDisplay = (rawText: string): ParsedActivityDisplay => {
  const cached = displayCache.get(rawText)
  if (cached) return cached

  let text = rawText.replace(/^[-*•]\s*/, '').trim()
  let project: string | undefined
  let jira: string | undefined

  // Match [Project: Name] or [Name] prefix
  const projectMatch = text.match(/^\[(?:Project:\s*)?([^\]]+)\]\s*(.*)$/i)
  if (projectMatch && projectMatch[1]) {
    project = projectMatch[1].trim()
    text = (projectMatch[2] || '').trim()
  }

  // Match (Jira: KEY-123) or [Jira: KEY-123]
  const jiraMatch = text.match(/[([](?:Jira:\s*)?([A-Z0-9]+-\d+)[)\]]/i)
  if (jiraMatch && jiraMatch[1]) {
    jira = jiraMatch[1].toUpperCase()
    text = text.replace(jiraMatch[0], '').trim()
  }

  const result: ParsedActivityDisplay = {
    project,
    jira,
    cleanText: text || rawText,
  }
  displayCache.set(rawText, result)
  return result
}

// Watch for changes in row.aktivitas to sync local state
watch(
  () => props.row.aktivitas,
  (newText) => {
    const currentTexts = localActivities.value.map((a) => a.text).join('\n')
    if (newText !== currentTexts) {
      localActivities.value = parseActivities(newText, localActivities.value)
    }
  },
  { immediate: true },
)

// Date calculations for quick shift and month picker
const parsedDate = computed(() => parseISO(props.row.date))
const formattedCurrentDate = computed(() => format(parsedDate.value, 'dd MMM'))
const currentMonth = computed(() => props.row.date.slice(0, 7))

const prevDateObj = computed(() => subDays(parsedDate.value, 1))
const nextDateObj = computed(() => addDays(parsedDate.value, 1))
const prevDateStr = computed(() => format(prevDateObj.value, 'yyyy-MM-dd'))
const nextDateStr = computed(() => format(nextDateObj.value, 'yyyy-MM-dd'))

const canMovePrev = computed(() => prevDateStr.value.startsWith(currentMonth.value))
const canMoveNext = computed(() => nextDateStr.value.startsWith(currentMonth.value))
const prevDateLabel = computed(() => format(prevDateObj.value, 'dd MMM'))
const nextDateLabel = computed(() => format(nextDateObj.value, 'dd MMM'))

const availableMonthDates = computed(() => {
  const [yearStr, monthStr] = props.row.date.split('-')
  const year = parseInt(yearStr || '0', 10)
  const month = parseInt(monthStr || '0', 10) - 1
  const baseDate = new Date(year, month, 1)
  const daysCount = getDaysInMonth(baseDate)
  const dates = []
  for (let day = 1; day <= daysCount; day++) {
    const dateObj = setDate(baseDate, day)
    const dateStr = format(dateObj, 'yyyy-MM-dd')
    if (dateStr !== props.row.date) {
      dates.push({
        date: dateStr,
        label: format(dateObj, 'dd MMM (EEE)'),
      })
    }
  }
  return dates
})

interface DraggableEvent {
  added?: { element: ActivityItem; newIndex: number }
  removed?: { element: ActivityItem; oldIndex: number }
  moved?: { element: ActivityItem; oldIndex: number; newIndex: number }
}

const onDraggableChange = async (event: DraggableEvent) => {
  const newText = localActivities.value.map((a) => a.text).join('\n')
  const updatedRow = { ...props.row, aktivitas: newText }
  await dailyStore.updateRow(updatedRow)

  if (event.added) {
    success(`Moved activity to ${props.row.date}`)
  } else if (event.moved) {
    success('Reordered activity')
  }
}

// Move actions
const moveToPrev = async (itemText: string, itemId: string) => {
  openPopoverPerItem.value[itemId] = false
  await dailyStore.moveActivity(props.row.date, prevDateStr.value, itemText)
}

const moveToNext = async (itemText: string, itemId: string) => {
  openPopoverPerItem.value[itemId] = false
  await dailyStore.moveActivity(props.row.date, nextDateStr.value, itemText)
}

const moveToSpecific = async (itemText: string, itemId: string) => {
  const targetDate = targetDatePerItem.value[itemId]
  if (!targetDate) return
  openPopoverPerItem.value[itemId] = false
  targetDatePerItem.value[itemId] = ''
  await dailyStore.moveActivity(props.row.date, targetDate, itemText)
}

const moveUp = async (index: number, itemId: string) => {
  if (index <= 0) return
  openPopoverPerItem.value[itemId] = false
  const items = [...localActivities.value]
  const [removed] = items.splice(index, 1)
  if (removed) {
    items.splice(index - 1, 0, removed)
    localActivities.value = items
    const newText = items.map((a) => a.text).join('\n')
    await dailyStore.updateRow({ ...props.row, aktivitas: newText })
    success('Reordered activity')
  }
}

const moveDown = async (index: number, itemId: string) => {
  if (index >= localActivities.value.length - 1) return
  openPopoverPerItem.value[itemId] = false
  const items = [...localActivities.value]
  const [removed] = items.splice(index, 1)
  if (removed) {
    items.splice(index + 1, 0, removed)
    localActivities.value = items
    const newText = items.map((a) => a.text).join('\n')
    await dailyStore.updateRow({ ...props.row, aktivitas: newText })
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
