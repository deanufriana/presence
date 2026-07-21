<template>
  <Card class="overflow-hidden border-amber-500/10 shadow-lg shadow-amber-500/5">
    <CardHeader class="border-b border-border/40 bg-muted/10">
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="flex items-center gap-2 text-base">
            <div class="flex size-7 items-center justify-center rounded-md bg-amber-500/10">
              <Calendar class="size-4 text-amber-500" />
            </div>
            Yearly Report
          </CardTitle>
          <CardDescription class="mt-1">Summary anual yearly</CardDescription>
        </div>
        <div class="flex items-center gap-2">
          <Button
            v-if="isAiEnabled"
            variant="ai"
            size="xs"
            :disabled="summarizing"
            class="relative overflow-hidden group"
            @click="generateAiSummary"
          >
            <div v-if="summarizing" class="absolute inset-0 bg-violet-500/10 animate-pulse" />
            <Sparkles v-if="!summarizing" data-icon="inline-start" />
            <RefreshCw v-else class="animate-spin" data-icon="inline-start" />
            <span :class="{ 'animate-pulse': summarizing }">
              {{ summarizing ? 'Generating...' : 'AI Generate' }}
            </span>
          </Button>

          <Button variant="outline" size="xs" @click="addYearlyRow">
            <Plus data-icon="inline-start" />
            Add Row
          </Button>

          <Button
            variant="outline"
            size="xs"
            :disabled="!yearlyRows.length || exportingExcel || exportingDocx"
            class="border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/5 text-orange-600 dark:text-orange-400"
            @click="handleBastExport"
          >
            <File :class="{ 'animate-bounce': exportingExcel }" data-icon="inline-start" />
            Export BAST
          </Button>
        </div>
      </div>
      <!-- Yearly Highlights Section -->
      <Alert
        v-if="yearlyHighlights && isAiEnabled"
        class="border-amber-500/10 bg-amber-500/5 mt-3 relative pr-10"
      >
        <Sparkles class="size-4 text-amber-500 shrink-0" />
        <AlertTitle
          class="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider"
          >Yearly AI Summary</AlertTitle
        >
        <AlertDescription class="text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
          {{ yearlyHighlights }}
        </AlertDescription>
        <Button
          variant="ghost"
          size="icon"
          class="size-5 absolute right-3 top-3 text-muted-foreground hover:text-foreground shrink-0"
          @click="yearlyHighlights = ''"
        >
          <X />
        </Button>
      </Alert>
    </CardHeader>
    <CardContent class="p-0">
      <DataTable
        :data="yearlyRows"
        :columns="columns"
        :loading="isLoading"
        empty-message="Select a month in the header to load yearly data..."
        :empty-icon="Calendar"
      >
        <template #cell-no="{ index }">
          <div class="px-4 py-3 text-center font-medium text-muted-foreground bg-muted/5">
            {{ index + 1 }}
          </div>
        </template>

        <template #cell-tanggal="{ row }">
          <Input
            v-model="row.tanggal"
            class="w-full bg-transparent border-0 shadow-none focus-visible:ring-1 focus-visible:ring-amber-500/30 text-xs px-4"
            placeholder="dd/mm/yyyy"
          />
        </template>

        <template #cell-month="{ row }">
          <Input
            v-model="row.month"
            class="w-full bg-transparent border-0 shadow-none focus-visible:ring-1 focus-visible:ring-amber-500/30 text-xs px-4"
            placeholder="Month/Year"
          />
        </template>

        <template #cell-task="{ row }">
          <Textarea
            v-model="row.task"
            class="w-full bg-transparent border-0 shadow-none focus-visible:ring-1 focus-visible:ring-amber-500/30 text-xs px-4 py-2 resize-y min-h-[40px]"
            placeholder="Task description..."
          />
        </template>

        <template #cell-deliverable="{ row }">
          <Input
            v-model="row.deliverable"
            class="w-full bg-transparent border-0 shadow-none focus-visible:ring-1 focus-visible:ring-amber-500/30 text-xs px-4"
          />
        </template>

        <template #cell-status="{ row }">
          <Input
            v-model="row.status"
            class="w-full bg-transparent border-0 shadow-none focus-visible:ring-1 focus-visible:ring-amber-500/30 text-xs px-4"
          />
        </template>

        <template #cell-keterangan="{ row }">
          <Select v-model="row.keterangan">
            <SelectTrigger class="w-full border-0 shadow-none bg-transparent px-4 py-2 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Project">Project</SelectItem>
              <SelectItem value="Project Enhance">Project Enhance</SelectItem>
              <SelectItem value="Continuing (Daily)">Continuing (Daily)</SelectItem>
            </SelectContent>
          </Select>
        </template>

        <template #cell-actions="{ index }">
          <div class="flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              class="size-6 mx-auto flex items-center justify-center rounded-md text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-all"
              @click="removeYearlyRow(index)"
            >
              <Trash2 />
            </Button>
          </div>
        </template>
      </DataTable>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Calendar, Sparkles, RefreshCw, Plus, X, Trash2, File } from 'lucide-vue-next'
import { useDocxExport } from '~/composables/useDocxExport'
import { useToast } from '~/composables/use-toast'
import { Button } from '~/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card'
import { DataTable } from '~/components/ui/data-table'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { storeToRefs } from 'pinia'
import { useCoreStore } from '~/stores/core'
import { useYearlyStore } from '~/stores/yearly'

const coreStore = useCoreStore()
const yearlyStore = useYearlyStore()

const { isAiEnabled, selectedDate } = storeToRefs(coreStore)
const { yearlyRows, yearlyHighlights, summarizing, isLoading, currentYear } =
  storeToRefs(yearlyStore)

const columns = [
  { key: 'no', label: 'No', width: '50px', headerClass: 'text-center' },
  { key: 'tanggal', label: 'Tanggal', width: '120px' },
  { key: 'month', label: 'Bulan', width: '120px' },
  { key: 'task', label: 'Task/Aktivitas' },
  { key: 'deliverable', label: 'Deliverable', width: '120px' },
  { key: 'status', label: 'Status', width: '100px' },
  { key: 'keterangan', label: 'Keterangan', width: '160px' },
  { key: 'actions', label: '', width: '50px' },
]

const { generateAiSummary, addYearlyRow, removeYearlyRow, fetchYearlyData } = yearlyStore

const { exportingDocx } = useDocxExport()
const { exportBASTToExcel, exporting: exportingExcel } = useExcelExport()
const { success, error } = useToast()

const handleBastExport = async () => {
  try {
    // Map yearly rows to what exportBASTToExcel expects (MonthlyReportRow)
    const mappedRows = yearlyRows.value.map((r) => ({
      month: r.month,
      project: r.task,
      progres: '100%',
      done: r.status,
      status: r.keterangan,
    }))

    await exportBASTToExcel(mappedRows, selectedDate.value, coreStore.settings)
    success('BAST document exported to Excel!')
  } catch {
    error('Failed to export BAST document')
  }
}

watch(
  currentYear,
  () => {
    fetchYearlyData()
  },
  { immediate: true },
)
</script>
