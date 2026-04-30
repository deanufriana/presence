<template>
  <Card class="overflow-hidden border-violet-500/10 shadow-lg shadow-violet-500/5">
    <CardHeader class="border-b border-border/40 bg-muted/10">
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="flex items-center gap-2 text-base">
            <div class="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500/10">
              <FileText class="h-4 w-4 text-violet-500" />
            </div>
            Daily Report
          </CardTitle>
          <CardDescription class="mt-1">Daily attendance and activity log</CardDescription>
        </div>
        <div class="flex gap-2">
          <Button variant="gradient" size="xs" :disabled="syncing" @click="confirmSync()">
            <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': syncing }" />
            <span class="hidden sm:inline">Sync Activities</span>
          </Button>

          <Button
            v-if="isAiEnabled && dailyTable.some((r) => r.aktivitas && r.aktivitas.length > 5)"
            :variant="summarizingAll ? 'destructive' : 'ai'"
            size="xs"
            @click="summarizeAll"
          >
            <RefreshCw v-if="summarizingAll" class="h-3.5 w-3.5 animate-spin" />
            <Sparkles v-else class="h-3.5 w-3.5" />
            {{ summarizingAll ? 'Stop Summarizing' : 'Summarize All' }}
          </Button>

          <Button variant="excel" size="xs" :disabled="exporting" @click="handleExport">
            <Download class="h-3.5 w-3.5" :class="{ 'animate-bounce': exporting }" />
            {{ exporting ? 'Exporting...' : 'Export Excel' }}
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent class="p-0">
      <Timeline
        :items="dailyTable"
        :loading="isLoading"
        empty-message="No reports found for this month"
        empty-submessage="Click 'Sync Activities' to auto-create your report"
        :get-row-class="getRowClass"
      >
        <template #date="{ item: row }">
          <div class="flex flex-col sm:items-end">
            <span
              class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 leading-none"
            >
              {{ format(new Date(row.date), 'EEE') }}
            </span>
            <span class="text-xl font-black tabular-nums tracking-tighter mt-1 leading-none">
              {{ format(new Date(row.date), 'dd') }}
            </span>
          </div>
        </template>

        <template #metadata="{ item: row }">
          <!-- Attendance Times (Desktop) -->
          <div class="hidden sm:flex flex-col items-end gap-1.5 mt-4">
            <div
              v-if="row.masuk"
              class="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20"
              title="Jam Masuk"
            >
              <Clock class="h-3 w-3" />
              {{ row.masuk }}
            </div>
            <div
              v-if="row.pulang"
              class="flex items-center gap-1.5 text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20"
              title="Jam Pulang"
            >
              <Clock class="h-3 w-3" />
              {{ row.pulang }}
            </div>
            <div
              v-if="row.ti"
              class="flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20"
              title="TI"
            >
              <Zap class="h-3 w-3" />
              {{ row.ti }}
            </div>
          </div>

          <!-- Attendance Times (Mobile) -->
          <div class="flex sm:hidden flex-wrap gap-2 ml-auto">
            <span v-if="row.masuk" class="text-[10px] font-bold text-emerald-500"
              >In: {{ row.masuk }}</span
            >
            <span v-if="row.pulang" class="text-[10px] font-bold text-blue-500"
              >Out: {{ row.pulang }}</span
            >
          </div>
        </template>

        <template #badge="{ item: row }">
          <div
            v-if="isHoliday(row.date)"
            class="absolute -top-3 left-4 px-2 py-0.5 rounded-md bg-red-500 text-[10px] font-bold text-white shadow-lg z-20"
          >
            {{ getHolidayName(row.date) }}
          </div>
        </template>

        <template #content="{ item: row }">
          <div class="flex-1 min-h-[60px]" @dragover.prevent @drop="handleDrop($event, row.date)">
            <div
              :class="{
                'animate-pulse opacity-50': summarizingRows[row.date],
                'ring-1 ring-violet-500/20 rounded-xl': syncingRows[row.date],
              }"
              class="transition-all duration-500"
            >
              <div v-if="row.aktivitas" class="space-y-2">
                <div
                  v-for="(item, i) in parseActivities(row.aktivitas)"
                  :key="i"
                  draggable="true"
                  class="group/item flex items-start gap-3 p-2.5 rounded-xl bg-muted/40 border border-transparent hover:border-violet-500/20 hover:bg-violet-500/5 cursor-grab active:cursor-grabbing transition-all relative"
                  @click.stop
                  @dragstart="handleDragStart($event, item, row.date)"
                >
                  <div
                    v-if="!/^[-*•]/.test(item)"
                    class="h-2 w-2 rounded-full bg-violet-400 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(167,139,250,0.5)]"
                  />
                  <span class="flex-1 text-sm leading-relaxed text-foreground/90">{{ item }}</span>
                  <button
                    class="opacity-0 group-hover/item:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0"
                    title="Remove item"
                    @click.stop="deleteActivityItem(row.date, item)"
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div
                v-else
                class="h-full flex items-center text-muted-foreground/40 italic text-xs py-4 px-2 rounded-xl border border-dashed border-border/50"
              >
                No activities logged for this day. Click sync or add manually.
              </div>
            </div>
          </div>
        </template>

        <template #actions="{ item: row }">
          <button
            class="h-9 w-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-violet-500/10 hover:text-violet-500 transition-all"
            title="Edit Details"
            @click="
              openManualEntry({
                date: row.date,
                dayNum: parseInt(row.date.split('-').pop() || '0'),
              })
            "
          >
            <Pencil class="h-4 w-4" />
          </button>

          <button
            v-if="row.aktivitas"
            class="h-9 w-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500 transition-all"
            :title="copiedRows[row.date] ? 'Copied!' : 'Copy Activities'"
            @click="copyRow(row.aktivitas, row.date)"
          >
            <Check v-if="copiedRows[row.date]" class="h-4 w-4 text-emerald-500" />
            <Copy v-else class="h-4 w-4" />
          </button>

          <button
            v-if="isAiEnabled && row.aktivitas && row.aktivitas.length > 5"
            class="h-9 w-9 flex items-center justify-center rounded-xl text-violet-500 bg-violet-500/5 hover:bg-violet-500/20 transition-all"
            :disabled="summarizingRows[row.date]"
            title="AI Summarize"
            @click="summarizeRow(row)"
          >
            <RefreshCw v-if="summarizingRows[row.date]" class="h-4 w-4 animate-spin" />
            <Sparkles v-else class="h-4 w-4" />
          </button>

          <button
            class="h-9 w-9 flex items-center justify-center rounded-xl text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/20 transition-all"
            :disabled="syncingRows[row.date]"
            title="Sync Activity"
            @click="syncDayActivity(row.date)"
          >
            <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': syncingRows[row.date] }" />
          </button>

          <div class="h-px w-4 bg-border/40 hidden lg:block my-1" />

          <button
            class="h-9 w-9 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-all"
            title="Clear Day"
            @click="deleteActivity(row.date)"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </template>
      </Timeline>
    </CardContent>
    <SyncConfirmModal v-if="showConfirmSync" v-model="showConfirmSync" @confirm="executeSync" />
  </Card>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useToast } from '~/composables/use-toast'
import { useDailyStore } from '~/stores/daily'
import { useCoreStore } from '~/stores/core'
import { format, isWeekend } from 'date-fns'
import type { ReportRow } from '~/types/report'
import {
  FileText,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  Trash2,
  Download,
  Pencil,
  Clock,
  Zap,
} from 'lucide-vue-next'
import { useExcelExport } from '~/composables/useExcelExport'
import { Button } from '~/components/ui/button'
import { useCalendarStore } from '~/stores/calendar'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card'
import { Timeline } from '~/components/ui/timeline'

const SyncConfirmModal = defineAsyncComponent(
  () => import('~/components/report/SyncConfirmModal.vue'),
)

const coreStore = useCoreStore()
const dailyStore = useDailyStore()
const calendarStore = useCalendarStore()
const { getHolidayName, isHoliday } = calendarStore
const { success } = useToast()

const getRowClass = (row: ReportRow) => {
  return isWeekend(new Date(row.date)) || isHoliday(row.date)
    ? 'bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100/50 dark:hover:bg-red-900/30'
    : ''
}

const { isAiEnabled, selectedDate } = storeToRefs(coreStore)
const {
  dailyTable,
  summarizingRows,
  syncingRows,
  summarizingAll,
  isLoading,
  syncing,
  showConfirmSync,
} = storeToRefs(dailyStore)

const {
  confirmSync,
  executeSync,
  summarizeRow,
  summarizeAll,
  openManualEntry,
  deleteActivity,
  syncDayActivity,
  updateRow,
  fetchDailyReport,
} = dailyStore

const { dateDisplay } = storeToRefs(coreStore)
const { exportToExcel, exporting } = useExcelExport()

const handleExport = async () => {
  try {
    await exportToExcel(dailyTable.value, dateDisplay.value, coreStore.settings)
    success('Report exported successfully!')
  } catch (_err) {
    console.error('Export failed:', _err)
  }
}

const copiedRows = ref<Record<string, boolean>>({})

const copyRow = (text: string, date: string) => {
  navigator.clipboard.writeText(text)
  success(`Copied activity for ${date}`)
  copiedRows.value[date] = true
  setTimeout(() => {
    copiedRows.value[date] = false
  }, 2000)
}

watch(
  () => selectedDate.value,
  () => {
    fetchDailyReport()
  },
  { immediate: true },
)

// ─── Drag & Drop ──────────────────────────────────
const parseActivities = (text: string) => {
  if (!text) return []
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

const handleDragStart = (event: DragEvent, item: string, date: string) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', item)
    event.dataTransfer.setData('sourceDate', date)
    event.dataTransfer.effectAllowed = 'move'
  }
}

const handleDrop = async (event: DragEvent, targetDate: string) => {
  const item = event.dataTransfer?.getData('text/plain')
  const sourceDate = event.dataTransfer?.getData('sourceDate')

  if (!item || !sourceDate || sourceDate === targetDate) return

  const sourceRow = dailyTable.value.find((r) => r.date === sourceDate)
  const targetRow = dailyTable.value.find((r) => r.date === targetDate)

  if (!sourceRow || !targetRow) return

  // 1. Update source
  const sourceItems = parseActivities(sourceRow.aktivitas)
  sourceRow.aktivitas = sourceItems.filter((i) => i !== item).join('\n')

  // 2. Update target
  const targetItems = parseActivities(targetRow.aktivitas)
  targetItems.push(item)
  targetRow.aktivitas = targetItems.join('\n')

  await updateRow([sourceRow, targetRow])

  success(`Moved activity to ${targetDate}`)
}

const deleteActivityItem = async (date: string, item: string) => {
  const row = dailyTable.value.find((r) => r.date === date)
  if (row) {
    const items = parseActivities(row.aktivitas)
    const newItems = items.filter((i) => i !== item)
    row.aktivitas = newItems.join('\n')
    await updateRow(row)
    success(`Removed activity from ${date}`)
  }
}
</script>
