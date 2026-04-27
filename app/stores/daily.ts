import { defineStore } from 'pinia'
import { watchDebounced } from '@vueuse/core'
import { useCoreStore } from '~/stores/core'
import { useToast } from '~/composables/use-toast'
import { format, parseISO } from "date-fns"
import type { ReportRow } from '~/types/report'

export const useDailyStore = defineStore('daily', () => {
  const core = useCoreStore()
  const { success, error } = useToast()

  const localRows = ref<ReportRow[]>([])
  const manualActivitiesMap = ref<Record<string, string>>({})
  const summarizingRows = ref<Record<string, boolean>>({})
  const summarizingAll = ref(false)
  const syncingRows = ref<Record<string, boolean>>({})

  const showManualEntry = ref(false)
  const selectedDayForEntry = ref<{ date: string; dayNum: number } | null>(null)
  const manualActivityText = ref("")

  const showConfirmSync = ref(false)
  const syncing = ref(false)

  function setCache (reportRes: any) {
    if (reportRes?.success && reportRes.reports) {
      const map: Record<string, string> = {}
      const rows: ReportRow[] = reportRes.reports.map((r: any) => {
        if (r.aktivitas) map[r.date] = r.aktivitas
        return {
          date: r.date,
          masuk: r.masuk || "",
          pulang: r.pulang || "",
          ti: r.ti || "",
          aktivitas: r.aktivitas || "",
        }
      })
      manualActivitiesMap.value = map
      localRows.value = rows
    } else {
      manualActivitiesMap.value = {}
      localRows.value = []
    }
  }

  const copyReport = async () => {
    if (!localRows.value.length) return
    let tsv = ""
    let html = `<table style="border-collapse: collapse; width: 100%;"><tbody>`

    localRows.value.forEach((row) => {
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
      const blobHtml = new Blob([html], { type: "text/html" })
      const blobText = new Blob([tsv], { type: "text/plain" })
      const data = [new ClipboardItem({ "text/html": blobHtml, "text/plain": blobText })]
      await navigator.clipboard.write(data)
      core.copied = true
      success("Daily report copied as table!")
    } catch (err) {
      navigator.clipboard.writeText(tsv)
      core.copied = true
      error("Advanced copy failed, copied as plain text.")
    }
    setTimeout(() => (core.copied = false), 2000)
  }

  function confirmSync () {
    if (localRows.value.length > 0) {
      showConfirmSync.value = true
    } else {
      executeSync()
    }
  }

  async function executeSync () {
    showConfirmSync.value = false
    syncing.value = true
    core.pending = true
    try {
      const res: any = await $fetch("/api/report/daily/sync" as any, {
        query: { date: core.selectedDate, force: "true" },
      })
      if (res?.success && res.rows) {
        const newRows = res.rows
        const currentRows = [...localRows.value]

        newRows.forEach((newRow: any) => {
          const existingRowIndex = currentRows.findIndex((r) => r.date === newRow.date)
          if (existingRowIndex !== -1) {
            const existingRow = currentRows[existingRowIndex]
            if (!existingRow) return
            const splitActs = (str: string) => str.split(/\n|;/).map(s => s.trim().replace(/^- /, "")).filter(Boolean)
            const existingActs = splitActs(existingRow.aktivitas || "")
            const incomingActs = splitActs(newRow.aktivitas || "")

            incomingActs.forEach((act: string) => {
              if (!existingActs.some((ea) => ea.toLowerCase() === act.toLowerCase())) {
                existingActs.push(act)
              }
            })
            existingRow.aktivitas = existingActs.map(a => `- ${a}`).join('\n')
            existingRow.masuk = newRow.masuk || existingRow.masuk
            existingRow.pulang = newRow.pulang || existingRow.pulang
          } else {
            currentRows.push(newRow)
          }
        })

        currentRows.sort((a, b) => a.date.localeCompare(b.date))
        localRows.value = currentRows
        success("Synced successfully!")
      }
    } catch (err) {
      console.error("Failed to sync:", err)
      error("Failed to sync report data")
    } finally {
      syncing.value = false
      core.pending = false
    }
  }

  async function summarizeRow (row: ReportRow) {
    if (!row.aktivitas || row.aktivitas.length < 10) return
    summarizingRows.value[row.date] = true
    const activities = row.aktivitas.split(/\n|;/).map(a => a.trim().replace(/^- /, "")).filter(Boolean)
    try {
      const res: any = await $fetch("/api/report/daily/summary" as any, {
        method: "POST",
        body: { activities },
      })
      if (res.success) {
        row.aktivitas = res.summary
        success(`Summary generated for ${row.date}`)
      } else {
        error(res.error || "Failed to generate summary")
      }
    } catch (error: any) {
      console.error("Failed to summarize row:", error)
      error("Failed to connect to AI service")
    } finally {
      summarizingRows.value[row.date] = false
    }
  }

  async function summarizeAll () {
    if (summarizingAll.value) return
    summarizingAll.value = true
    
    // Get list of rows that need summary at the start
    const rowsToProcess = localRows.value.filter(row => 
      row.aktivitas && row.aktivitas.length > 5 && !summarizingRows.value[row.date]
    )

    const processSequentially = async (index: number) => {
      if (index >= rowsToProcess.length) return
      
      const row = rowsToProcess[index]
      if (row) {
        await summarizeRow(row)
        // Explicitly wait before next to be safe
        await new Promise(resolve => setTimeout(resolve, 500))
        await processSequentially(index + 1)
      }
    }

    try {
      await processSequentially(0)
      success("All available rows summarized!")
    } catch (err) {
      console.error("Failed to summarize all:", err)
      error("Error during batch summary")
    } finally {
      summarizingAll.value = false
    }
  }

  function removeDailyRow (idx: number) {
    const row = localRows.value[idx]
    localRows.value.splice(idx, 1)
    if (row) success(`Removed report for ${row.date}`)
  }

  const openManualEntry = (day: any) => {
    selectedDayForEntry.value = { date: day.date, dayNum: day.dayNum }
    manualActivityText.value = manualActivitiesMap.value[day.date] || ""
    showManualEntry.value = true
  }

  const saveManualActivity = async () => {
    if (!selectedDayForEntry.value) return
    await $fetch("/api/report/daily" as any, {
      method: "POST",
      body: { date: selectedDayForEntry.value.date, activity: manualActivityText.value },
    })
    manualActivitiesMap.value[selectedDayForEntry.value.date] = manualActivityText.value
    showManualEntry.value = false
    success(`Activity saved for ${selectedDayForEntry.value.date}`)
    core.refreshReport()
  }

  const deleteManualActivity = async (date: string) => {
    try {
      await $fetch("/api/report/daily" as any, { method: "DELETE", query: { date } })
      delete manualActivitiesMap.value[date]
      const rowIndex = localRows.value.findIndex((r) => r.date === date)
      if (rowIndex !== -1) {
        const target = localRows.value[rowIndex]
        if (target) target.aktivitas = ""
      }
      success(`Activity removed for ${date}`)
    } catch (err) {
      console.error("Failed to delete activity:", err)
      error("Failed to delete activity")
    }
  }

  const syncDayActivity = async (date: string) => {
    syncingRows.value[date] = true
    try {
      const res: any = await $fetch(`/api/report/daily/sync/${date}` as any)
      if (res.success && res.data) {
        const { aktivitas, masuk, pulang, ti } = res.data
        const rowIndex = localRows.value.findIndex((r) => r.date === date)
        if (rowIndex !== -1) {
          const row = localRows.value[rowIndex]
          if (row) {
            row.aktivitas = aktivitas
            row.masuk = masuk
            row.pulang = pulang
            row.ti = ti
          }
        } else {
          localRows.value.push(res.data)
          localRows.value.sort((a, b) => a.date.localeCompare(b.date))
        }
        manualActivitiesMap.value[date] = aktivitas
        success(`Activity synced for ${date}`)
      } else {
        error(res.error || `No activity found for ${date}`)
      }
    } catch (err) {
      console.error("Failed to sync day activity:", err)
      error("Failed to sync day activity")
    } finally {
      syncingRows.value[date] = false
    }
  }

  function formatTime (dateStr: string) {
    try { return format(parseISO(dateStr), "HH:mm") } catch (e) { return dateStr }
  }

  watchDebounced(localRows, async (newRows) => {
    if (newRows.length >= 0) {
      await $fetch("/api/report/daily" as any, { method: "POST", body: newRows })
      newRows.forEach((r) => {
        if (r.aktivitas) manualActivitiesMap.value[r.date] = r.aktivitas
        else delete manualActivitiesMap.value[r.date]
      })
    }
  }, { deep: true, debounce: 1000 })

  return {
    localRows,
    manualActivitiesMap,
    summarizingRows,
    syncingRows,
    showManualEntry,
    selectedDayForEntry,
    manualActivityText,
    showConfirmSync,
    syncing,
    summarizingAll,
    setCache,
    copyReport,
    confirmSync,
    executeSync,
    summarizeRow,
    summarizeAll,
    removeDailyRow,
    openManualEntry,
    saveManualActivity,
    deleteManualActivity,
    syncDayActivity,
    formatTime,
  }
})
