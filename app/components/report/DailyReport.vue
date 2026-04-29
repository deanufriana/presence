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
        <div class="flex gap-4">
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
      <DataTable
        :data="dailyTable"
        :columns="columns"
        :row-class="getRowClass"
        :loading="isLoading"
        empty-message="Click 'Sync Activity' to auto create your report..."
        :empty-icon="FileText"
      >
        <template #cell-date="{ row }">
          <div class="px-4 py-2 font-medium text-muted-foreground">
            <div class="flex flex-col">
              <span>{{ format(new Date(row.date), 'dd/MM/yyyy') }}</span>
              <span
                v-if="isHoliday(row.date)"
                class="text-[9px] text-red-500 font-bold leading-tight mt-0.5"
              >
                {{ getHolidayName(row.date) }}
              </span>
            </div>
          </div>
        </template>

        <template #cell-masuk="{ row }">
          <input
            v-model="row.masuk"
            class="w-full h-full px-4 py-2 bg-transparent border-0 outline-none focus:ring-1 focus:ring-violet-500/30 transition-all"
            @change="updateRow(row)"
          >
        </template>

        <template #cell-pulang="{ row }">
          <input
            v-model="row.pulang"
            class="w-full h-full px-4 py-2 bg-transparent border-0 outline-none focus:ring-1 focus:ring-violet-500/30 transition-all"
            @change="updateRow(row)"
          >
        </template>

        <template #cell-ti="{ row }">
          <input
            v-model="row.ti"
            class="w-full h-full px-4 py-2 bg-transparent border-0 outline-none focus:ring-1 focus:ring-violet-500/30 transition-all"
            @change="updateRow(row)"
          >
        </template>

        <template #cell-aktivitas="{ row }">
          <div
            class="relative group min-h-[44px] w-full h-full transition-colors"
            @dragover.prevent
            @drop="handleDrop($event, row.date)"
          >
            <div
              class="w-full h-full min-h-[44px] px-4 py-2.5 cursor-pointer hover:bg-violet-500/5 transition-colors text-sm leading-relaxed relative"
            >
              <div
                :class="{
                  'animate-pulse opacity-50': summarizingRows[row.date],
                }"
                class="transition-all duration-500"
              >
                <div v-if="row.aktivitas" class="space-y-1">
                  <div
                    v-for="(item, i) in parseActivities(row.aktivitas)"
                    :key="i"
                    draggable="true"
                    class="group/item flex items-start gap-2 p-1.5 rounded bg-muted/30 border border-transparent hover:border-violet-500/30 hover:bg-violet-500/5 cursor-grab active:cursor-grabbing transition-all relative"
                    @click.stop
                    @dragstart="handleDragStart($event, item, row.date)"
                  >
                    <div
                      v-if="!/^[-*•]/.test(item)"
                      class="h-1.5 w-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0"
                    />
                    <span class="flex-1">{{ item }}</span>
                    <button
                      class="opacity-0 group-hover/item:opacity-100 p-0.5 rounded-sm text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
                      title="Remove item"
                      @click.stop="deleteActivityItem(row.date, item)"
                    >
                      <Trash2 class="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <span v-else class="text-muted-foreground/40 italic text-[11px]"
                  >Click to add activity...</span
                >
              </div>

              <div
                v-if="summarizingRows[row.date]"
                class="absolute inset-0 flex items-center justify-center bg-violet-500/5 backdrop-blur-[1px] rounded-md z-20"
              />
            </div>
          </div>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex flex-col items-center justify-center gap-0.5 py-1">
            <!-- Edit Button -->
            <button
              class="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              title="Edit Day"
              @click="
                openManualEntry({
                  date: row.date,
                  dayNum: parseInt(row.date.split('-').pop() || '0'),
                })
              "
            >
              <Pencil class="h-3.5 w-3.5" />
            </button>

            <!-- Copy Button -->
            <button
              v-if="row.aktivitas"
              class="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              :title="copiedRows[row.date] ? 'Copied!' : 'Copy activity'"
              @click="copyRow(row.aktivitas, row.date)"
            >
              <Check v-if="copiedRows[row.date]" class="h-3.5 w-3.5 text-emerald-500" />
              <Copy v-else class="h-3.5 w-3.5" />
            </button>

            <!-- Summarize Button -->
            <button
              v-if="isAiEnabled && row.aktivitas && row.aktivitas.length > 5"
              class="h-7 w-7 flex items-center justify-center rounded-md text-violet-500 hover:bg-violet-500/10 transition-all"
              :class="{
                'opacity-100 bg-violet-500/5': summarizingRows[row.date],
              }"
              :disabled="summarizingRows[row.date]"
              title="Summarize Day"
              @click="summarizeRow(row)"
            >
              <RefreshCw
                v-if="summarizingRows[row.date]"
                class="h-3.5 w-3.5 animate-spin text-violet-600"
              />
              <Sparkles v-else class="h-3.5 w-3.5" />
            </button>

            <!-- Sync Button -->
            <button
              class="h-7 w-7 flex items-center justify-center rounded-md text-emerald-500 hover:bg-emerald-500/10 transition-all"
              :class="{
                'opacity-100 bg-emerald-500/5': syncingRows[row.date],
              }"
              :disabled="syncingRows[row.date]"
              title="Sync Day Activity"
              @click="syncDayActivity(row.date)"
            >
              <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': syncingRows[row.date] }" />
            </button>

            <!-- Delete Button -->
            <button
              class="h-7 w-7 flex items-center justify-center rounded-md text-red-400 hover:bg-red-500/10 transition-all"
              title="Delete Day"
              @click="deleteActivity(row.date)"
            >
              <Trash2 class="h-3.5 w-3.5" />
            </button>
          </div>
        </template>
      </DataTable>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { ReportRow } from '~/types/report'
import { useToast } from '~/composables/use-toast'
import { useDailyStore } from '~/stores/daily'
import { useCoreStore } from '~/stores/core'
import { format, isWeekend } from 'date-fns'
import {
  FileText,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  Trash2,
  Download,
  Pencil,
} from 'lucide-vue-next'
import { useExcelExport } from '~/composables/useExcelExport'
import { Button } from '~/components/ui/button'
import { useCalendarStore } from '~/stores/calendar'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card'
import DataTable from '~/components/ui/DataTable.vue'

const coreStore = useCoreStore()
const dailyStore = useDailyStore()
const calendarStore = useCalendarStore()
const { success } = useToast()

const { isAiEnabled, selectedDate } = storeToRefs(coreStore)
const { dailyTable, summarizingRows, syncingRows, summarizingAll, isLoading } =
  storeToRefs(dailyStore)

const {
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
const { getHolidayName, isHoliday } = calendarStore

const columns = [
  { key: 'date', label: 'Tanggal', width: '120px' },
  { key: 'masuk', label: 'Masuk', width: '100px' },
  { key: 'pulang', label: 'Pulang', width: '100px' },
  { key: 'ti', label: 'TI', width: '60px' },
  { key: 'aktivitas', label: 'Aktivitas' },
  { key: 'actions', label: '', width: '40px' },
]

const getRowClass = (row: ReportRow) => {
  return isWeekend(new Date(row.date)) || isHoliday(row.date)
    ? 'bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100/50 dark:hover:bg-red-900/30'
    : ''
}

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
