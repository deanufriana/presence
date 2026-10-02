<template>
  <Card class="overflow-hidden border-indigo-500/10 shadow-lg shadow-indigo-500/5">
    <CardHeader class="border-b border-border/40 bg-muted/10">
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="flex items-center gap-2 text-base">
            <div class="flex size-7 items-center justify-center rounded-md bg-indigo-500/10">
              <CalendarDays class="size-4 text-indigo-500" />
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
            <Sparkles v-if="!summarizing" data-icon="inline-start" />
            <RefreshCw v-else class="animate-spin" data-icon="inline-start" />
            <span :class="{ 'animate-pulse': summarizing }">
              {{ summarizing ? 'Generating...' : 'AI Generate' }}
            </span>
          </Button>
          <Button variant="outline" size="xs" @click="addMonthlyRow(dateDisplay)">
            <Plus data-icon="inline-start" />
            Add Row
          </Button>

          <Button
            variant="outline"
            size="xs"
            :disabled="!monthlyRows.length || exportingDocx"
            class="border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-500/5 text-blue-600 dark:text-blue-400"
            @click="handleDocxExport"
          >
            <File :class="{ 'animate-bounce': exportingDocx }" data-icon="inline-start" />
            Export Task Job
          </Button>

          <Button
            variant="outline"
            size="xs"
            :disabled="!monthlyRows.length || exportingExcel || exportingDocx"
            class="border-indigo-500/20 hover:border-indigo-500/50 hover:bg-indigo-500/5 text-indigo-600 dark:text-indigo-400"
            @click="handleBASTExport"
          >
            <FileText :class="{ 'animate-bounce': exportingExcel }" data-icon="inline-start" />
            Export BAST
          </Button>
        </div>
      </div>
      <!-- Monthly Highlights Section -->
      <Alert
        v-if="monthlyHighlights && isAiEnabled"
        class="bg-violet-500/5 border-violet-500/10 mt-3 animate-in fade-in slide-in-from-top-1 relative"
      >
        <Sparkles class="text-violet-500" data-icon="inline-start" />
        <AlertTitle
          class="text-violet-700 dark:text-violet-300 font-semibold uppercase tracking-wider text-xs"
        >
          AI Generated Summary
        </AlertTitle>
        <AlertDescription
          class="text-xs leading-relaxed text-muted-foreground whitespace-pre-line pr-6"
        >
          {{ monthlyHighlights }}
        </AlertDescription>
        <Button
          variant="ghost"
          size="icon"
          class="absolute right-2 top-2 size-5 text-muted-foreground hover:text-foreground shrink-0"
          @click="monthlyHighlights = ''"
        >
          <X />
        </Button>
      </Alert>

      <!-- BAST Readiness & Mandays Summary Banner -->
      <div
        v-if="monthlyRows.length > 0"
        class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-border/40"
      >
        <div class="p-2.5 rounded-xl bg-muted/30 border border-border/40 text-center">
          <div class="text-sm font-black tabular-nums text-foreground">
            {{ totalWorkingDays }} MD
          </div>
          <div class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
            Target Mandays
          </div>
        </div>
        <div class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
          <div class="text-sm font-black tabular-nums text-emerald-600 dark:text-emerald-400">
            {{ totalAllocatedMD }} MD
          </div>
          <div
            class="text-[10px] font-bold uppercase tracking-wider text-emerald-600/70 dark:text-emerald-400/70"
          >
            Allocated ({{ Math.round((totalAllocatedMD / (totalWorkingDays || 1)) * 100) }}%)
          </div>
        </div>
        <div class="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
          <div class="text-sm font-black tabular-nums text-indigo-600 dark:text-indigo-400">
            {{ monthlyRows.length }}
          </div>
          <div
            class="text-[10px] font-bold uppercase tracking-wider text-indigo-600/70 dark:text-indigo-400/70"
          >
            BAST Tasks
          </div>
        </div>
        <div
          class="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-center flex flex-col justify-center"
        >
          <div class="text-xs font-bold text-violet-600 dark:text-violet-400 truncate">
            {{ statusCounts.project }} Proj / {{ statusCounts.enhance }} Enh /
            {{ statusCounts.continuing }} BAU
          </div>
          <div
            class="text-[10px] font-bold uppercase tracking-wider text-violet-600/70 dark:text-violet-400/70"
          >
            Classification
          </div>
        </div>
      </div>
    </CardHeader>
    <CardContent class="p-0">
      <Timeline
        :items="monthlyRows"
        :loading="isLoading"
        empty-message='Click "AI Generate" or "Add Row" to start your monthly report...'
      >
        <template #date>
          <div class="flex flex-col sm:items-end">
            <span
              class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 leading-none"
            >
              Month
            </span>
            <span
              class="text-sm font-black tabular-nums tracking-tighter mt-1 leading-none text-indigo-500 uppercase"
            >
              {{ formatMonth }}
            </span>
          </div>
        </template>

        <template #content="{ item: row, index }">
          <div class="space-y-4">
            <!-- Project / Description -->
            <div class="relative group">
              <Textarea
                v-model="row.project"
                class="w-full bg-muted/20 rounded-xl border-transparent focus-visible:border-indigo-500/30 min-h-[80px]"
                placeholder="Feature / improvement description..."
              />

              <!-- Copy Button -->
              <div
                class="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200"
              >
                <Button
                  v-if="row.project"
                  variant="ghost"
                  size="icon"
                  class="size-7 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  :title="copiedRows['row-' + index] ? 'Copied!' : 'Copy description'"
                  @click.stop="copyRow(row.project, 'row-' + index)"
                >
                  <Check v-if="copiedRows['row-' + index]" class="text-emerald-500" />
                  <Copy v-else />
                </Button>
              </div>

              <!-- Badges Container -->
              <div class="absolute right-2 bottom-2 z-20 flex items-center gap-1.5">
                <!-- Mandays Badge -->
                <Badge
                  variant="outline"
                  class="h-6 px-2 text-[10px] font-black border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-full cursor-help"
                  title="Estimated Mandays (MD) for BAST"
                >
                  {{ allocatedMDs[index] || 0 }} MD
                </Badge>

                <!-- Sources Badge -->
                <div v-if="row.sources && row.sources.length">
                  <TooltipProvider :delay-duration="100">
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Badge
                          variant="secondary"
                          class="h-6 px-2 flex items-center gap-1.5 text-[9px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 cursor-help rounded-full"
                        >
                          <CalendarDays class="size-3" />
                          {{ row.sources.length }} dates
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="left" class="p-3 text-[10px] max-w-[240px]">
                        <p class="font-bold mb-2 flex items-center gap-1.5 text-indigo-500">
                          <Sparkles class="size-3" />
                          Attributed Dates:
                        </p>
                        <div class="flex flex-wrap gap-1.5">
                          <span
                            v-for="date in row.sources"
                            :key="date"
                            class="px-1.5 py-0.5 rounded bg-muted/50 border border-border/50 font-medium"
                          >
                            {{ date }}
                          </span>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>

            <!-- Metadata Inputs -->
            <FieldGroup class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field>
                <FieldLabel class="text-[10px] font-bold text-muted-foreground uppercase ml-1"
                  >Progress</FieldLabel
                >
                <Input
                  v-model="row.progres"
                  class="h-9 bg-muted/20 border-transparent focus-visible:border-indigo-500/30 text-xs font-bold"
                  placeholder="100%"
                />
              </Field>

              <Field>
                <FieldLabel class="text-[10px] font-bold text-muted-foreground uppercase ml-1"
                  >Done</FieldLabel
                >
                <Select v-model="row.done">
                  <SelectTrigger
                    class="h-9 w-full bg-muted/20 border-transparent rounded-lg focus:ring-0 focus:ring-offset-0 text-xs font-medium"
                  >
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Done">Done</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel class="text-[10px] font-bold text-muted-foreground uppercase ml-1"
                  >Job Status</FieldLabel
                >
                <Select v-model="row.status">
                  <SelectTrigger
                    class="h-9 w-full bg-muted/20 border-transparent rounded-lg focus:ring-0 focus:ring-offset-0 text-xs font-medium"
                  >
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Project">Project</SelectItem>
                    <SelectItem value="Project Enhance">Project Enhance</SelectItem>
                    <SelectItem value="Continuing (Daily)"> Continuing (Daily) </SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>

            <!-- Jira Issues (manually linked) -->
            <div class="rounded-lg border border-blue-500/20 bg-blue-500/5">
              <div class="flex items-center gap-2 px-2.5 py-1.5">
                <Trello class="size-3 shrink-0 text-blue-600 dark:text-blue-400" />
                <span
                  class="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400"
                >
                  Jira Issues
                </span>
                <Badge
                  v-if="row.jiraKeys?.length"
                  variant="secondary"
                  class="h-4 px-1.5 text-[9px] font-black bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20 rounded-full"
                >
                  {{ row.jiraKeys.length }}
                </Badge>

                <Popover
                  :open="openJiraRow === index"
                  @update:open="(v: boolean) => (openJiraRow = v ? index : null)"
                >
                  <PopoverTrigger as-child>
                    <Button
                      variant="ghost"
                      size="xs"
                      class="ml-auto h-6 px-2 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-500/15"
                    >
                      <Plus class="size-3" />
                      Link Issue
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" class="w-80 p-0">
                    <div class="flex items-center gap-2 p-2 border-b border-border/60">
                      <Input
                        :model-value="jiraSearch[index] || ''"
                        placeholder="Search key, summary, project, status..."
                        class="h-7 text-xs"
                        @update:model-value="(v) => (jiraSearch[index] = String(v))"
                      />
                      <button
                        type="button"
                        class="shrink-0 flex items-center gap-1 h-6 px-1.5 rounded border text-[9px] font-bold uppercase tracking-wider transition-colors"
                        :class="
                          hideDoneIssues
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'border-border/50 text-muted-foreground hover:bg-muted'
                        "
                        :aria-pressed="hideDoneIssues"
                        title="Only list issues that are not finished"
                        @click="hideDoneIssues = !hideDoneIssues"
                      >
                        <Check v-if="hideDoneIssues" class="size-2.5" />
                        Not Done
                      </button>
                    </div>
                    <div class="max-h-64 overflow-y-auto p-1">
                      <div
                        v-if="!allJiraEvents.length"
                        class="px-2 py-4 text-[10px] text-muted-foreground text-center"
                      >
                        No Jira issues loaded. Run &quot;Sync All&quot; for this month first.
                      </div>
                      <div
                        v-else-if="!filteredJiraEvents(index).length"
                        class="px-2 py-4 text-[10px] text-muted-foreground text-center"
                      >
                        <template v-if="jiraSearch[index]">
                          No issues match &quot;{{ jiraSearch[index] }}&quot;.
                        </template>
                        <template v-else-if="hiddenDoneCount">
                          All {{ allJiraEvents.length }} issues are finished. Turn off &quot;Not
                          Done&quot; to see them.
                        </template>
                      </div>
                      <label
                        v-for="ev in filteredJiraEvents(index)"
                        :key="ev.id"
                        class="flex items-start gap-2 rounded px-2 py-1.5 cursor-pointer hover:bg-blue-500/10"
                      >
                        <Checkbox
                          :model-value="isJiraLinked(row, ev.key)"
                          class="mt-0.5"
                          @update:model-value="toggleJiraKey(row, ev.key)"
                        />
                        <span class="min-w-0 flex-1">
                          <span class="flex items-center gap-1.5 flex-wrap">
                            <span class="font-mono font-bold text-blue-600 dark:text-blue-400">
                              {{ ev.key }}
                            </span>
                            <span
                              v-if="isSuggested(index, ev.key)"
                              class="text-[8px] font-bold uppercase tracking-wider px-1 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            >
                              suggested
                            </span>
                          </span>
                          <span class="block text-[10px] leading-tight">{{ ev.summary }}</span>
                          <span
                            v-if="ev.project_name || ev.type || ev.status"
                            class="block text-[9px] text-muted-foreground/70"
                          >
                            {{ [ev.project_name, ev.type, ev.status].filter(Boolean).join(' • ') }}
                          </span>
                        </span>
                      </label>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <!-- Linked issues -->
              <div
                v-if="row.jiraKeys?.length"
                class="border-t border-blue-500/20 px-2.5 py-2 flex flex-wrap gap-1.5"
              >
                <Badge
                  v-for="key in row.jiraKeys"
                  :key="key"
                  variant="secondary"
                  class="h-5 pl-1.5 pr-1 gap-1 text-[9px] font-mono font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20"
                  :title="jiraSummary(key)"
                >
                  {{ key }}
                  <button
                    type="button"
                    class="rounded p-0.5 hover:bg-blue-500/25 transition-colors"
                    :aria-label="`Unlink ${key}`"
                    @click="removeJiraKey(row, key)"
                  >
                    <X class="size-2.5" />
                  </button>
                </Badge>
              </div>

              <!-- Date-based suggestions -->
              <div
                v-else-if="suggestedByRow[index]?.size"
                class="border-t border-blue-500/20 px-2.5 py-1.5 flex items-center gap-2"
              >
                <span class="text-[9px] text-muted-foreground">
                  {{ suggestedByRow[index].size }} issue(s) touched on this row's dates
                </span>
                <Button
                  variant="ghost"
                  size="xs"
                  class="ml-auto h-5 px-1.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15"
                  @click="linkSuggested(row, index)"
                >
                  Link all
                </Button>
              </div>
            </div>
          </div>
        </template>

        <template #actions="{ index }">
          <Button
            variant="ghost"
            size="icon"
            class="size-9 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
            title="Remove row"
            @click="removeMonthlyRow(index)"
          >
            <Trash2 />
          </Button>
        </template>
      </Timeline>
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
  Trello,
} from 'lucide-vue-next'
import { useDocxExport } from '~/composables/useDocxExport'
import { useToast } from '~/composables/use-toast'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Field, FieldGroup, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Checkbox } from '~/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Textarea } from '~/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Timeline } from '~/components/ui/timeline'
import { storeToRefs } from 'pinia'
import { useCoreStore } from '~/stores/core'
import { useMonthlyStore } from '~/stores/monthly'
import { useDailyStore } from '~/stores/daily'
import { useJiraStore } from '~/stores/jira'
import { calculateMandaysAllocation } from '~/utils/mandays'
import { format } from 'date-fns'
import { useLocalStorage } from '@vueuse/core'
import type { JiraEvent } from '~/types/jira'
import type { MonthlyReportRow } from '~/types/report'

const coreStore = useCoreStore()
const monthlyStore = useMonthlyStore()
const dailyStore = useDailyStore()
const jiraStore = useJiraStore()

const { isAiEnabled, selectedDate, dateDisplay, formatMonth } = storeToRefs(coreStore)
const { monthlyRows, monthlyHighlights, summarizing, isLoading } = storeToRefs(monthlyStore)
const { dailyTable } = storeToRefs(dailyStore)
const { jiraData } = storeToRefs(jiraStore)

// Every Jira issue synced for the selected month, newest activity first.
const allJiraEvents = computed<JiraEvent[]>(() => {
  const events = jiraData.value?.events || []
  return [...events].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  )
})

const jiraEventByKey = computed(() => {
  const map = new Map<string, JiraEvent>()
  for (const ev of allJiraEvents.value) map.set(ev.key, ev)
  return map
})

// Issues whose activity date overlaps a row's attributed dates. Purely a hint to
// speed up manual linking - the actual links live in row.jiraKeys.
const suggestedByRow = computed<Set<string>[]>(() =>
  monthlyRows.value.map((row) => {
    const found = new Set<string>()
    if (!row.sources?.length) return found

    const sourceSet = new Set(row.sources)
    for (const ev of allJiraEvents.value) {
      try {
        // Local-time key, matching how dates are bucketed everywhere else.
        if (sourceSet.has(format(new Date(ev.updated_at), 'yyyy-MM-dd'))) found.add(ev.key)
      } catch {
        // Ignore unparsable dates
      }
    }
    return found
  }),
)

// Statuses treated as finished. Jira workflows differ per board, so this covers
// the common terminal names plus the Indonesian "Selesai".
const DONE_STATUSES = new Set(['done', 'closed', 'resolved', 'complete', 'completed', 'selesai'])

const isIssueDone = (ev: JiraEvent) => DONE_STATUSES.has((ev.status || '').trim().toLowerCase())

// Defaults on: for a monthly report the open issues are the useful ones.
const hideDoneIssues = useLocalStorage('presence.hideDoneJira', true)

const selectableJiraEvents = computed(() =>
  hideDoneIssues.value ? allJiraEvents.value.filter((ev) => !isIssueDone(ev)) : allJiraEvents.value,
)

const hiddenDoneCount = computed(
  () => allJiraEvents.value.length - selectableJiraEvents.value.length,
)

const jiraSearch = ref<Record<number, string>>({})
const openJiraRow = ref<number | null>(null)

const isJiraLinked = (row: MonthlyReportRow, key: string) => !!row.jiraKeys?.includes(key)

const isSuggested = (index: number, key: string) => !!suggestedByRow.value[index]?.has(key)

function toggleJiraKey(row: MonthlyReportRow, key: string) {
  const current = row.jiraKeys || []
  row.jiraKeys = current.includes(key) ? current.filter((k) => k !== key) : [...current, key]
}

const removeJiraKey = (row: MonthlyReportRow, key: string) => {
  row.jiraKeys = (row.jiraKeys || []).filter((k) => k !== key)
}

const linkSuggested = (row: MonthlyReportRow, index: number) => {
  const suggested = [...(suggestedByRow.value[index] || [])]
  row.jiraKeys = [...new Set([...(row.jiraKeys || []), ...suggested])]
}

const jiraSummary = (key: string) => jiraEventByKey.value.get(key)?.summary || 'Linked issue'

const filteredJiraEvents = (index: number) => {
  const q = (jiraSearch.value[index] || '').trim().toLowerCase()
  if (!q) return selectableJiraEvents.value

  return selectableJiraEvents.value.filter((ev) =>
    [ev.key, ev.summary, ev.project_name, ev.status, ev.type]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(q)),
  )
}

const { generateAiSummary, addMonthlyRow, removeMonthlyRow, fetchMonthlyReport } = monthlyStore
const { exportTaskJob, exportingDocx } = useDocxExport()
const { exportBASTToExcel, getWorkingDaysCount, exporting: exportingExcel } = useExcelExport()
const { success, error } = useToast()

const totalWorkingDays = computed(() => {
  const [yearStr, monthStr] = selectedDate.value.split('-')
  const y = parseInt(yearStr || '0', 10)
  const m = parseInt(monthStr || '0', 10) - 1
  return getWorkingDaysCount(y, m)
})

const allocatedMDs = computed(() => {
  return calculateMandaysAllocation(monthlyRows.value, totalWorkingDays.value)
})

const totalAllocatedMD = computed(() => {
  return allocatedMDs.value.reduce((acc, val) => acc + val, 0)
})

const statusCounts = computed(() => {
  let project = 0
  let enhance = 0
  let continuing = 0
  for (const r of monthlyRows.value) {
    const s = (r.status || '').toLowerCase()
    if (s.includes('enhance')) enhance++
    else if (s.includes('continuing') || s.includes('daily')) continuing++
    else project++
  }
  return { project, enhance, continuing }
})

const handleDocxExport = async () => {
  try {
    await exportTaskJob(monthlyRows.value, selectedDate.value, coreStore.settings)
    success('Monthly report exported to Word!')
  } catch {
    error('Failed to export Word document')
  }
}

const handleBASTExport = async () => {
  try {
    await exportBASTToExcel(monthlyRows.value, selectedDate.value, coreStore.settings)
    success('BAST exported to Excel!')
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

watch(
  () => selectedDate.value,
  () => {
    fetchMonthlyReport()
  },
  { immediate: true },
)
</script>
