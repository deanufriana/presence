import { defineStore } from 'pinia'
import { useCoreStore } from '~/stores/core'
import { useToast } from '~/composables/use-toast'
import { format, parseISO } from 'date-fns'
import type { ReportRow } from '~/types/report'

export const useDailyStore = defineStore('daily', () => {
  const core = useCoreStore()
  const { success, error } = useToast()

  const dailyTable = ref<ReportRow[]>([])
  const summarizingRows = ref<Record<string, boolean>>({})
  const summarizingAll = ref(false)
  const shouldStopSummarizing = ref(false)
  // let currentAbortController: AbortController | null = null
  const syncingRows = ref<Record<string, boolean>>({})

  const showManualEntry = ref(false)
  const selectedDayForEntry = ref<{ date: string; dayNum: number } | null>(null)
  const manualActivityText = ref('')
  const manualHolidayName = ref('')
  const isManualHoliday = ref(false)
  const isLoading = ref(false)

  const showConfirmSync = ref(false)
  const syncing = ref(false)

  // Computed map for quick lookup by date
  const manualActivitiesMap = computed(() => {
    const map: Record<string, string> = {}
    dailyTable.value.forEach((row) => {
      if (row.aktivitas) {
        map[row.date] = row.aktivitas
      }
    })
    return map
  })

  async function fetchDailyReport() {
    try {
      isLoading.value = true
      const { getDailyReports } = await import('~/utils/reports')
      const reports = await getDailyReports(core.selectedDate)

      const rows: ReportRow[] = reports.map((r) => {
        return {
          date: r.date,
          masuk: r.masuk || '',
          pulang: r.pulang || '',
          ti: r.ti || '',
          aktivitas: r.aktivitas || '',
        }
      })
      dailyTable.value = rows
    } catch (err: unknown) {
      console.error('Failed to fetch daily report:', err)
      error('Failed to fetch daily report')
    } finally {
      isLoading.value = false
    }
  }

  function applySyncedRows(newRows: ReportRow[]) {
    const currentRows = [...dailyTable.value]
    newRows.forEach((newRow) => {
      const existingRowIndex = currentRows.findIndex((r) => r.date === newRow.date)
      if (existingRowIndex !== -1) {
        currentRows[existingRowIndex] = { ...currentRows[existingRowIndex], ...newRow }
      } else {
        currentRows.push(newRow)
      }
    })
    currentRows.sort((a, b) => a.date.localeCompare(b.date))
    dailyTable.value = currentRows
  }

  function confirmSync() {
    if (dailyTable.value.length > 0) {
      showConfirmSync.value = true
    } else {
      executeSync()
    }
  }

  async function executeSync() {
    showConfirmSync.value = false
    syncing.value = true
    core.pending = true
    try {
      await core.syncAllActivities(true)

      const { fetchAndGroupActivities, upsertDailyReport } = await import('~/utils/reports')
      const grouped = await fetchAndGroupActivities(core.selectedDate, true)

      const syncedRows: ReportRow[] = []
      for (const [date, activities] of Object.entries(grouped)) {
        const report = await upsertDailyReport({ date, activities })
        if (report) {
          syncedRows.push({
            date: report.date,
            masuk: report.masuk || '',
            pulang: report.pulang || '',
            ti: report.ti || '',
            aktivitas: report.aktivitas || '',
          })
        }
      }

      applySyncedRows(syncedRows)
      success('Synced successfully!')
    } catch (err) {
      console.error('Failed to sync:', err)
      error('Failed to sync report data')
    } finally {
      syncing.value = false
      core.pending = false
    }
  }

  async function summarizeRow(row: ReportRow) {
    if (!row.aktivitas || row.aktivitas.length < 10) return
    summarizingRows.value[row.date] = true
    const activitiesList = row.aktivitas
      .split(/\n|;/)
      .map((a) => a.trim().replace(/^- /, ''))
      .filter(Boolean)

    try {
      const { generateSummary } = await import('~/utils/ai')
      const { getDailyPrompt } = await import('~/utils/prompts')

      const prompt = getDailyPrompt(activitiesList)
      const summary = await generateSummary(prompt, {})

      if (summary) {
        row.aktivitas = summary
        await saveActivity(row.date, summary)
        success(`Summary generated for ${row.date}`)
      }
    } catch (err: unknown) {
      console.error('Failed to summarize row:', err)
      error('Failed to generate summary')
    } finally {
      summarizingRows.value[row.date] = false
    }
  }

  async function summarizeAll() {
    if (summarizingAll.value) {
      shouldStopSummarizing.value = true
      return
    }

    summarizingAll.value = true
    shouldStopSummarizing.value = false

    const rowsToProcess = dailyTable.value.filter(
      (row) => row.aktivitas && row.aktivitas.length > 5 && !summarizingRows.value[row.date],
    )

    async function processSequentially(index: number) {
      if (index >= rowsToProcess.length || shouldStopSummarizing.value) return
      const row = rowsToProcess[index]
      if (row) {
        await summarizeRow(row)
        await new Promise((resolve) => setTimeout(resolve, 500))
        await processSequentially(index + 1)
      }
    }

    try {
      await processSequentially(0)
      if (!shouldStopSummarizing.value) {
        success('All rows summarized successfully!')
      } else {
        error('Summarization stopped by user')
      }
    } catch (err) {
      console.error('Failed summarize all:', err)
    } finally {
      summarizingAll.value = false
      shouldStopSummarizing.value = false
    }
  }

  async function deleteActivity(date: string) {
    try {
      const { deleteDailyReport } = await import('~/queries/reports')
      await deleteDailyReport(date)

      const rowIndex = dailyTable.value.findIndex((r) => r.date === date)
      if (rowIndex !== -1) {
        dailyTable.value.splice(rowIndex, 1)
      }
      success(`Activity deleted for ${date}`)
    } catch (err) {
      console.error('Failed to delete activity:', err)
      error('Failed to delete activity')
    }
  }

  async function openManualEntry(day: { date: string; dayNum: number }) {
    showManualEntry.value = true
    selectedDayForEntry.value = { date: day.date, dayNum: day.dayNum }
    manualActivityText.value = manualActivitiesMap.value[day.date] || ''

    const { useCalendarStore } = await import('~/stores/calendar')
    const calendarStore = useCalendarStore()
    const holiday = calendarStore.holidays.find((h) => h.date === day.date)
    isManualHoliday.value = !!holiday
    manualHolidayName.value = holiday ? holiday.name : ''
  }

  const saveManualHoliday = async () => {
    if (!selectedDayForEntry.value) return
    try {
      const { upsertManualHoliday } = await import('~/queries/calendar')
      await upsertManualHoliday({
        date: selectedDayForEntry.value.date,
        name: manualHolidayName.value,
        isHoliday: isManualHoliday.value,
      })

      const { useCalendarStore } = await import('~/stores/calendar')
      const calendarStore = useCalendarStore()
      await calendarStore.fetchHolidays()
    } catch (err) {
      console.error('Failed to save holiday:', err)
    }
  }

  const saveActivity = async (date: string, aktivitas: string) => {
    try {
      const { upsertDailyReport } = await import('~/utils/reports')
      const report = await upsertDailyReport({ date, activities: [aktivitas] })

      if (report) {
        const rowIndex = dailyTable.value.findIndex((r) => r.date === date)
        if (dailyTable.value[rowIndex]) {
          dailyTable.value[rowIndex].aktivitas = report.aktivitas || ''
          dailyTable.value[rowIndex].masuk = report.masuk || ''
          dailyTable.value[rowIndex].pulang = report.pulang || ''
          dailyTable.value[rowIndex].ti = report.ti || ''
        } else {
          dailyTable.value.push({
            date: date,
            masuk: report.masuk || '',
            pulang: report.pulang || '',
            ti: report.ti || '',
            aktivitas: report.aktivitas || '',
          })
          dailyTable.value.sort((a, b) => a.date.localeCompare(b.date))
        }
      }
    } catch (err) {
      console.error('Failed to save activity:', err)
    }
  }

  const saveManualActivity = async () => {
    if (!selectedDayForEntry.value) return
    await saveManualHoliday()
    await saveActivity(selectedDayForEntry.value.date, manualActivityText.value)
    showManualEntry.value = false
    success(`Data updated for ${selectedDayForEntry.value.date}`)
  }

  const syncDayActivity = async (date: string) => {
    syncingRows.value[date] = true
    try {
      const { fetchAndGroupActivities, upsertDailyReport } = await import('~/utils/reports')
      const grouped = await fetchAndGroupActivities(date, false)

      if (grouped[date]) {
        const report = await upsertDailyReport({ date, activities: grouped[date] })
        if (report) {
          applySyncedRows([
            {
              date: report.date,
              masuk: report.masuk || '',
              pulang: report.pulang || '',
              ti: report.ti || '',
              aktivitas: report.aktivitas || '',
            },
          ])
          success(`Activity synced for ${date}`)
          return
        }
      }
      error(`No activity found for ${date}`)
    } catch {
      console.error('Failed to sync day activity')
      error('Failed to sync day activity')
    } finally {
      syncingRows.value[date] = false
    }
  }

  function formatTime(dateStr: string) {
    try {
      return format(parseISO(dateStr), 'HH:mm')
    } catch {
      return ''
    }
  }

  const updateRow = async (data: ReportRow | ReportRow[]) => {
    try {
      const { upsertDailyReport } = await import('~/utils/reports')
      const rows = Array.isArray(data) ? data : [data]
      for (const row of rows) {
        await upsertDailyReport({ date: row.date, activities: [row.aktivitas] })
      }
    } catch {
      console.error('Failed to update row(s)')
      error('Failed to save changes')
    }
  }

  return {
    isLoading,
    dailyTable,
    manualActivitiesMap,
    summarizingRows,
    syncingRows,
    showManualEntry,
    selectedDayForEntry,
    manualActivityText,
    manualHolidayName,
    isManualHoliday,
    showConfirmSync,
    syncing,
    summarizingAll,
    fetchDailyReport,
    confirmSync,
    executeSync,
    summarizeRow,
    summarizeAll,
    deleteActivity,
    openManualEntry,
    saveManualActivity,
    syncDayActivity,
    formatTime,
    updateRow,
  }
})
