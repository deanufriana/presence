import { defineStore } from 'pinia'
import { useCoreStore } from '~/stores/core'
import { useToast } from '~/composables/use-toast'
import type { MonthlyReportRow } from '~/types/report'
import { watchDebounced } from '@vueuse/core'

export const useMonthlyStore = defineStore('monthly', () => {
  const core = useCoreStore()
  const { success, error, loading } = useToast()

  const monthlyRows = ref<MonthlyReportRow[]>([])
  const monthlyHighlights = ref('')
  const summarizing = ref(false)
  const isLoading = ref(false)

  async function fetchMonthlyReport() {
    isLoading.value = true
    try {
      const res = await $fetch<{
        success: boolean
        report: { rows: MonthlyReportRow[]; summary: string }
      }>('/api/report/monthly', {
        query: { month: core.selectedDate },
      })
      if (res?.success && res.report) {
        monthlyRows.value = res.report.rows || []
        monthlyHighlights.value = res.report.summary || ''
      }
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } }
      error(e.data?.error || 'Failed to fetch monthly report')
    } finally {
      isLoading.value = false
    }
  }

  async function generateAiSummary() {
    summarizing.value = true
    const loadingToastId = loading('Generating monthly report with AI...')
    try {
      const res = await $fetch<{
        success: boolean
        summary: string
        rows?: MonthlyReportRow[]
        error?: string
      }>('/api/report/monthly/summary', {
        method: 'POST',
        body: { month: core.selectedDate },
      })

      if (res.success) {
        monthlyHighlights.value = res.summary || ''
        if (res.rows && Array.isArray(res.rows)) {
          monthlyRows.value = res.rows
        }
        success('Monthly report and table generated!', { id: loadingToastId })
      } else {
        error(res.error || 'Failed to generate monthly report', { id: loadingToastId })
      }
    } catch (err: unknown) {
      console.error('Failed to generate AI summary:', err)
      error('AI service error', { id: loadingToastId })
    } finally {
      summarizing.value = false
    }
  }

  function addMonthlyRow(monthName?: string) {
    monthlyRows.value.push({
      month: monthName || '',
      project: '',
      progres: '100%',
      done: 'Done',
      status: 'Project',
    })
  }

  function removeMonthlyRow(idx: number) {
    monthlyRows.value.splice(idx, 1)
  }

  watchDebounced(
    monthlyRows,
    async (newRows) => {
      if (newRows.length >= 0) {
        await $fetch('/api/report/monthly', {
          method: 'POST',
          body: { month: core.selectedDate, rows: newRows, summary: monthlyHighlights.value },
        })
      }
    },
    { deep: true, debounce: 1000 },
  )

  return {
    isLoading,
    monthlyRows,
    monthlyHighlights,
    summarizing,
    fetchMonthlyReport,
    generateAiSummary,
    addMonthlyRow,
    removeMonthlyRow,
  }
})
