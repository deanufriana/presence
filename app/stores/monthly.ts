import { defineStore } from 'pinia'
import { watchDebounced } from '@vueuse/core'
import { useCoreStore } from '~/stores/core'
import { useToast } from '~/composables/use-toast'
import type { MonthlyReportRow } from '~/types/report'

export const useMonthlyStore = defineStore('monthly', () => {
  const core = useCoreStore()
  const { success, error, loading } = useToast()

  const monthlyRows = ref<MonthlyReportRow[]>([])
  const monthlyHighlights = ref("")
  const summarizing = ref(false)
  const copiedMonthly = ref(false)

  function setCache (monthlyRes: any) {
    if (monthlyRes?.success && monthlyRes.report) {
      monthlyRows.value = monthlyRes.report.rows || []
      monthlyHighlights.value = monthlyRes.report.summary || ""
    } else {
      monthlyRows.value = []
      monthlyHighlights.value = ""
    }
  }

  async function generateAiSummary () {
    summarizing.value = true
    const loadingToastId = loading("Generating monthly report with AI...")
    try {
      const res: any = await $fetch("/api/report/monthly/summary" as any, {
        method: "POST",
        body: { month: core.selectedDate },
      })

      if (res.success) {
        monthlyHighlights.value = res.summary || ""
        if (res.rows && Array.isArray(res.rows)) {
          monthlyRows.value = res.rows
        }
        success("Monthly report and table generated!", { id: loadingToastId })
      } else {
        error(res.error || "Failed to generate monthly report", { id: loadingToastId })
      }
    } catch (error: any) {
      console.error("Failed to generate AI summary:", error)
      error("AI service error", { id: loadingToastId })
    } finally {
      summarizing.value = false
    }
  }

  function addMonthlyRow (monthName?: string) {
    monthlyRows.value.push({
      month: monthName || "",
      project: "",
      progres: "100%",
      done: "Done",
      status: "Project",
    })
  }

  function removeMonthlyRow (idx: number) {
    monthlyRows.value.splice(idx, 1)
  }

  const copyMonthlyReport = async () => {
    if (!monthlyRows.value.length) return
    let tsv = ""
    let html = `<table border="1" style="border-collapse: collapse; width: 100%; font-family: sans-serif; font-size: 11pt;"><tbody>`
    monthlyRows.value.forEach((row) => {
      tsv += `${row.month}\t${row.project}\t${row.progres}\t${row.done}\t${row.status}\n`
      html += `<tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${row.month}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${row.project}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${row.progres}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${row.done}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${row.status}</td>
      </tr>`
    })
    html += `</tbody></table>`
    try {
      const blobHtml = new Blob([html], { type: "text/html" })
      const blobText = new Blob([tsv], { type: "text/plain" })
      const data = [new ClipboardItem({ "text/html": blobHtml, "text/plain": blobText })]
      await navigator.clipboard.write(data)
      copiedMonthly.value = true
      success("Monthly report copied as table!")
    } catch (err) {
      navigator.clipboard.writeText(tsv)
      copiedMonthly.value = true
      error("Advanced copy failed, copied as plain text.")
    }
    setTimeout(() => (copiedMonthly.value = false), 2000)
  }

  watchDebounced(monthlyRows, async (newRows) => {
    if (newRows.length >= 0) {
      await $fetch("/api/report/monthly" as any, {
        method: "POST",
        body: { month: core.selectedDate, rows: newRows, summary: monthlyHighlights.value },
      })
    }
  }, { deep: true, debounce: 1000 })

  return {
    monthlyRows,
    monthlyHighlights,
    summarizing,
    copiedMonthly,
    setCache,
    generateAiSummary,
    addMonthlyRow,
    removeMonthlyRow,
    copyMonthlyReport,
  }
})
