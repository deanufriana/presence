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
  let currentAbortController: AbortController | null = null
  const syncingRows = ref<Record<string, boolean>>({})

  const showManualEntry = ref(false)
  const selectedDayForEntry = ref<{ date: string; dayNum: number } | null>(null)
  const manualActivityText = ref('')
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
      const res = await $fetch<{ success: boolean; reports: ReportRow[] }>('/api/report/daily', {
        query: { date: core.selectedDate },
      })
      if (res?.success && res.reports) {
        const rows: ReportRow[] = res.reports.map((r) => {
          return {
            date: r.date,
            masuk: r.masuk || '',
            pulang: r.pulang || '',
            ti: r.ti || '',
            aktivitas: r.aktivitas || '',
          }
        })
        dailyTable.value = rows
      }
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } }
      error(e.data?.error || 'Failed to fetch daily report')
    } finally {
      isLoading.value = false
    }
  }

  function applySyncedRows(newRows: ReportRow[]) {
    const currentRows = [...dailyTable.value]
    newRows.forEach((newRow) => {
      const existingRowIndex = currentRows.findIndex((r) => r.date === newRow.date)
      if (existingRowIndex !== -1) {
        const existingRow = currentRows[existingRowIndex]
        if (existingRow) {
          existingRow.aktivitas = newRow.aktivitas
          existingRow.masuk = newRow.masuk
          existingRow.pulang = newRow.pulang
          existingRow.ti = newRow.ti || existingRow.ti
        }
      } else {
        currentRows.push(newRow)
      }
    })
    currentRows.sort((a, b) => a.date.localeCompare(b.date))
    dailyTable.value = currentRows
  }

  const copyReport = async () => {
    if (!dailyTable.value.length) return
    let tsv = ''
    let html = `<table style="border-collapse: collapse; width: 100%;"><tbody>`

    dailyTable.value.forEach((row) => {
      tsv += `${row.date}\t${row.masuk}\t${row.pulang}\t${row.ti}\t${row.aktivitas}\n`
      html += `<tr>
        <td>${row.date}</td>
        <td>${row.masuk}</td>
        <td>${row.pulang}</td>
        <td>${row.ti}</td>
        <td>${row.aktivitas}</td>
      </tr>`
    })

    html += `</tbody></table>`

    try {
      const blobHtml = new Blob([html], { type: 'text/html' })
      const blobText = new Blob([tsv], { type: 'text/plain' })
      const data = [new ClipboardItem({ 'text/html': blobHtml, 'text/plain': blobText })]
      await navigator.clipboard.write(data)
      core.copied = true
      success('Daily report copied as table!')
    } catch {
      navigator.clipboard.writeText(tsv)
      core.copied = true
      error('Advanced copy failed, copied as plain text.')
    }
    setTimeout(() => (core.copied = false), 2000)
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
      const res = await $fetch<{ success: boolean; rows: ReportRow[] }>('/api/report/daily/sync', {
        query: { date: core.selectedDate, force: 'true' },
      })
      if (res?.success && res.rows) {
        applySyncedRows(res.rows)
        success('Synced successfully!')
      }
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
    const activities = row.aktivitas
      .split(/\n|;/)
      .map((a) => a.trim().replace(/^- /, ''))
      .filter(Boolean)

    currentAbortController = new AbortController()

    try {
      const res = await $fetch<{ success: boolean; summary: string; error?: string }>(
        '/api/report/daily/summary',
        {
          method: 'POST',
          body: { activities },
          signal: currentAbortController.signal,
        },
      )
      if (res.success) {
        row.aktivitas = res.summary
        // Explicitly save to database
        await saveActivity(row.date, res.summary)
        success(`Summary generated for ${row.date}`)
      } else {
        error(res.error || 'Failed to generate summary')
      }
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return
      console.error('Failed to summarize row:', err)
      error('Failed to connect to AI service')
    } finally {
      summarizingRows.value[row.date] = false
      currentAbortController = null
    }
  }

  async function summarizeAll() {
    if (summarizingAll.value) {
      shouldStopSummarizing.value = true
      currentAbortController?.abort()
      return
    }

    summarizingAll.value = true
    shouldStopSummarizing.value = false

    // Get list of rows that need summary at the start
    const rowsToProcess = dailyTable.value.filter(
      (row) => row.aktivitas && row.aktivitas.length > 5 && !summarizingRows.value[row.date],
    )

    const processSequentially = async (index: number) => {
      if (index >= rowsToProcess.length || shouldStopSummarizing.value) return

      const row = rowsToProcess[index]
      if (row) {
        await summarizeRow(row)
        // Explicitly wait before next to be safe
        await new Promise((resolve) => setTimeout(resolve, 500))
        await processSequentially(index + 1)
      }
    }

    try {
      await processSequentially(0)
      if (shouldStopSummarizing.value) {
        success('Summarization stopped')
      } else {
        success('All available rows summarized!')
      }
    } catch (err) {
      console.error('Failed to summarize all:', err)
      error('Error during batch summary')
    } finally {
      summarizingAll.value = false
      shouldStopSummarizing.value = false
    }
  }

  async function deleteActivity(date: string) {
    try {
      await $fetch('/api/report/daily', {
        method: 'DELETE',
        body: { date },
      })

      const rowIndex = dailyTable.value.findIndex((r) => r.date === date)
      if (rowIndex !== -1) {
        dailyTable.value.splice(rowIndex, 1)
      }

      success(`Activity removed for ${date}`)
    } catch {
      console.error('Failed to delete activity')
      error('Failed to delete activity')
    }
  }

  const openManualEntry = (day: { date: string; dayNum: number }) => {
    selectedDayForEntry.value = { date: day.date, dayNum: day.dayNum }
    manualActivityText.value = manualActivitiesMap.value[day.date] || ''
    showManualEntry.value = true
  }

  const saveActivity = async (date: string, activity: string) => {
    const res = await $fetch<{ success: boolean; report: ReportRow }>('/api/report/daily', {
      method: 'POST',
      body: { date, activity },
    })

    if (res?.success && res.report) {
      const updated = res.report
      const rowIndex = dailyTable.value.findIndex((r) => r.date === date)
      if (dailyTable.value[rowIndex]) {
        dailyTable.value[rowIndex].aktivitas = updated.aktivitas
        dailyTable.value[rowIndex].masuk = updated.masuk
        dailyTable.value[rowIndex].pulang = updated.pulang
        dailyTable.value[rowIndex].ti = updated.ti
      } else {
        dailyTable.value.push({
          date: date,
          masuk: updated.masuk || '',
          pulang: updated.pulang || '',
          ti: updated.ti || '',
          aktivitas: updated.aktivitas || '',
        })
        dailyTable.value.sort((a, b) => a.date.localeCompare(b.date))
      }
    }
  }

  const saveManualActivity = async () => {
    if (!selectedDayForEntry.value) return
    await saveActivity(selectedDayForEntry.value.date, manualActivityText.value)
    showManualEntry.value = false
    success(`Activity saved for ${selectedDayForEntry.value.date}`)
  }

  const syncDayActivity = async (date: string) => {
    syncingRows.value[date] = true
    try {
      const res = await $fetch<{ success: boolean; data: ReportRow; error?: string }>(
        `/api/report/daily/sync/${date}`,
      )
      if (res.success && res.data) {
        applySyncedRows([res.data])
        success(`Activity synced for ${date}`)
      } else {
        error(res.error || `No activity found for ${date}`)
      }
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
      return dateStr
    }
  }

  const updateRow = async (row: ReportRow) => {
    try {
      await $fetch('/api/report/daily', {
        method: 'POST',
        body: row,
      })
    } catch {
      console.error('Failed to update row')
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
    showConfirmSync,
    syncing,
    summarizingAll,
    fetchDailyReport,
    copyReport,
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
