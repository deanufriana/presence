<template>
  <Card class="overflow-hidden border-indigo-500/10 shadow-lg shadow-indigo-500/5">
    <CardHeader class="border-b border-border/40 bg-muted/10">
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="flex items-center gap-2 text-base">
            <div class="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500/10">
              <CalendarDays class="h-4 w-4 text-indigo-500" />
            </div>
            Monthly Report
          </CardTitle>
          <CardDescription class="mt-1">Project highlights and progress summary</CardDescription>
        </div>
        <div class="flex items-center gap-2">
          <Button
            v-if="isAiEnabled"
            variant="ai"
            size="xs"
            :disabled="!dailyTable.length || summarizing"
            class="relative overflow-hidden group"
            @click="generateAiSummary"
          >
            <div v-if="summarizing" class="absolute inset-0 bg-violet-500/10 animate-pulse" />
            <Sparkles v-if="!summarizing" class="h-3.5 w-3.5" />
            <RefreshCw v-else class="h-3.5 w-3.5 animate-spin" />
            <span :class="{ 'animate-pulse': summarizing }">
              {{ summarizing ? 'Generating...' : 'AI Generate' }}
            </span>
          </Button>
          <Button variant="outline" size="xs" @click="addMonthlyRow(dateDisplay)">
            <Plus class="h-3.5 w-3.5" />
            Add Row
          </Button>

          <Button
            variant="outline"
            size="xs"
            :disabled="!monthlyRows.length || exportingDocx"
            class="border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-500/5 text-blue-600 dark:text-blue-400"
            @click="handleDocxExport"
          >
            <File class="h-3.5 w-3.5" :class="{ 'animate-bounce': exportingDocx }" />
            Export Task Job
          </Button>

          <Button
            variant="outline"
            size="xs"
            :disabled="!monthlyRows.length || exportingDocx"
            class="border-indigo-500/20 hover:border-indigo-500/50 hover:bg-indigo-500/5 text-indigo-600 dark:text-indigo-400"
            @click="handleBASTExport"
          >
            <FileText class="h-3.5 w-3.5" :class="{ 'animate-bounce': exportingDocx }" />
            Export BAST
          </Button>
        </div>
      </div>
      <!-- Monthly Highlights Section -->
      <div
        v-if="monthlyHighlights && isAiEnabled"
        class="px-4 py-3 bg-violet-500/5 border-t border-violet-500/10 animate-in fade-in slide-in-from-top-1 mt-3"
      >
        <div class="flex items-start gap-3">
          <Sparkles class="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
          <div class="space-y-1 flex-1">
            <p
              class="text-xs font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wider"
            >
              AI Generated Summary
            </p>
            <p class="text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
              {{ monthlyHighlights }}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            class="h-5 w-5 ml-auto text-muted-foreground hover:text-foreground shrink-0"
            @click="monthlyHighlights = ''"
          >
            <X class="h-3 w-3" />
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent class="p-0">
      <DataTable
        :data="monthlyRows"
        :columns="columns"
        :loading="isLoading"
        empty-message='Click "AI Generate" or "Add Row" to start your monthly report...'
        :empty-icon="CalendarDays"
      >
        <template #cell-month="{ row }">
          <div
            class="px-4 py-3 font-medium text-muted-foreground bg-muted/5 select-none whitespace-nowrap uppercase tracking-wider"
          >
            {{ formatMonthOnly(row.month) }}
          </div>
        </template>

        <template #cell-project="{ row, index }">
          <div class="relative group h-full">
            <textarea
              v-model="row.project"
              rows="3"
              class="w-full px-4 py-2.5 bg-transparent border-0 outline-none focus:ring-1 focus:ring-violet-500/30 resize-y min-h-[44px] block text-sm leading-relaxed"
              placeholder="Feature / improvement description..."
            />

            <div
              v-if="row.sources && row.sources.length"
              class="absolute right-2 bottom-2 flex items-center gap-1 transition-all duration-200 z-20"
            >
              <TooltipProvider :delay-duration="100">
                <Tooltip>
                  <TooltipTrigger as-child>
                    <Badge
                      variant="secondary"
                      class="h-5 w-5 p-0 flex items-center justify-center text-[9px] font-medium bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 border-indigo-500/10 cursor-help rounded-full"
                    >
                      <CalendarDays class="h-3 w-3" />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="left" class="p-2 text-[10px]">
                    <p class="font-semibold mb-1">Source activities from:</p>
                    <div class="flex flex-wrap gap-1 max-w-[200px]">
                      <span
                        v-for="date in row.sources"
                        :key="date"
                        class="px-1 py-0.5 rounded bg-muted border border-border/50"
                      >
                        {{ date }}
                      </span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div
              class="absolute right-2 top-2 flex items-center gap-1 transition-all duration-200 z-10"
            >
              <button
                v-if="row.project"
                class="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                :title="copiedRows['row-' + index] ? 'Copied!' : 'Copy description'"
                @click.stop="copyRow(row.project, 'row-' + index)"
              >
                <Check v-if="copiedRows['row-' + index]" class="h-3.5 w-3.5 text-emerald-500" />
                <Copy v-else class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </template>

        <template #cell-progres="{ row }">
          <input
            v-model="row.progres"
            class="w-full h-full px-4 py-2 bg-transparent border-0 outline-none focus:ring-1 focus:ring-violet-500/30 transition-all"
            placeholder="100%"
          >
        </template>

        <template #cell-done="{ row }">
          <Select v-model="row.done">
            <SelectTrigger
              class="w-full h-full border-0 shadow-none focus:ring-0 focus:ring-offset-0 bg-transparent px-4 py-2 text-xs"
            >
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Done">Done</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </template>

        <template #cell-status="{ row }">
          <Select v-model="row.status">
            <SelectTrigger
              class="w-full h-full border-0 shadow-none focus:ring-0 focus:ring-offset-0 bg-transparent px-4 py-2 text-xs"
            >
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Project">Project</SelectItem>
              <SelectItem value="Project Enhance">Project Enhance</SelectItem>
              <SelectItem value="Continuing (Daily)"> Continuing (Daily) </SelectItem>
            </SelectContent>
          </Select>
        </template>

        <template #cell-actions="{ index }">
          <div class="flex items-center justify-center">
            <button
              class="h-6 w-6 mx-auto flex items-center justify-center rounded-md text-red-400 hover:bg-red-500/10 transition-all duration-200"
              title="Remove row"
              @click="removeMonthlyRow(index)"
            >
              <Trash2 class="h-3 w-3" />
            </button>
          </div>
        </template>
      </DataTable>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import {
  CalendarDays,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  Plus,
  X,
  Trash2,
  File,
  FileText,
} from 'lucide-vue-next'
import { useDocxExport } from '~/composables/useDocxExport'
import { useToast } from '~/composables/use-toast'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card'
import { DataTable } from '~/components/ui/data-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { storeToRefs } from 'pinia'
import { useCoreStore } from '~/stores/core'
import { useMonthlyStore } from '~/stores/monthly'
import { useDailyStore } from '~/stores/daily'
import { format, parse } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

const coreStore = useCoreStore()
const monthlyStore = useMonthlyStore()
const dailyStore = useDailyStore()

const { isAiEnabled, selectedDate, dateDisplay } = storeToRefs(coreStore)
const { monthlyRows, monthlyHighlights, summarizing, isLoading } = storeToRefs(monthlyStore)
const { dailyTable } = storeToRefs(dailyStore)

const columns = [
  { key: 'month', label: 'Bulan', width: '100px' },
  { key: 'project', label: 'Project Yang Dikerjakan' },
  { key: 'progres', label: 'Progres', width: '100px' },
  { key: 'done', label: 'Done', width: '100px' },
  { key: 'status', label: 'Status Pekerjaan', width: '160px' },
  { key: 'actions', label: '', width: '50px' },
]

const { generateAiSummary, addMonthlyRow, removeMonthlyRow, fetchMonthlyReport } = monthlyStore
const { exportToDocx, exportBAST, exportingDocx } = useDocxExport()
const { success, error } = useToast()

const handleDocxExport = async () => {
  try {
    await exportToDocx(monthlyRows.value, selectedDate.value, coreStore.settings)
    success('Monthly report exported to Word!')
  } catch {
    error('Failed to export Word document')
  }
}

const handleBASTExport = async () => {
  try {
    await exportBAST(monthlyRows.value, selectedDate.value, coreStore.settings)
    success('BAST exported to Word!')
  } catch {
    error('Failed to export BAST document')
  }
}

const copiedRows = ref<Record<string, boolean>>({})

const copyRow = (text: string, id: string) => {
  navigator.clipboard.writeText(text)
  copiedRows.value[id] = true
  setTimeout(() => {
    copiedRows.value[id] = false
  }, 2000)
}

const formatMonthOnly = (dateStr: string) => {
  if (!dateStr) return ''
  try {
    const d = dateStr.includes('-') ? parse(dateStr, 'yyyy-MM', new Date()) : new Date(dateStr)
    return format(d, 'MMMM', { locale: idLocale })
  } catch {
    return dateStr
  }
}

watch(
  () => selectedDate.value,
  () => {
    fetchMonthlyReport()
  },
  { immediate: true },
)
</script>
