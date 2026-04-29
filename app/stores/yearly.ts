import { defineStore } from 'pinia'
import { watchDebounced } from '@vueuse/core'
import { useCoreStore } from '~/stores/core'
import { useToast } from '~/composables/use-toast'
import type { YearlyReportRow, YearlyActivityMonth } from '~/types/report'

export const useYearlyStore = defineStore('yearly', () => {
  const core = useCoreStore()
  const { success, error, loading } = useToast()

  const yearlyRows = ref<YearlyReportRow[]>([])
  const yearlyHighlights = ref('')
  const yearlyActivities = ref<YearlyActivityMonth[]>([])
  const summarizing = ref(false)
  const copiedYearly = ref(false)
  const fetchingActivities = ref(false)
  const isLoading = ref(false)

  const currentYear = computed(() => core.selectedDate.split('-')[0])

  async function fetchYearlyData() {
    isLoading.value = true
    try {
      const res = await $fetch<{ success: boolean; rows: YearlyReportRow[]; summary: string }>(
        '/api/report/yearly',
        {
          query: { year: currentYear.value },
        },
      )
      if (res.success) {
        yearlyRows.value = res.rows || []
        yearlyHighlights.value = res.summary || ''
      }
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } }
      error(e.data?.error || 'Failed to fetch yearly data', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchYearlyActivities() {
    fetchingActivities.value = true
    try {
      const res = await $fetch<{ success: boolean; months: YearlyActivityMonth[] }>(
        '/api/report/yearly/activities',
        {
          query: { year: currentYear.value },
        },
      )
      if (res.success) {
        yearlyActivities.value = res.months || []
      }
    } catch (err) {
      console.error('Failed to fetch yearly activities:', err)
    } finally {
      fetchingActivities.value = false
    }
  }

  async function generateAiSummary() {
    summarizing.value = true
    const loadingToastId = loading('Generating yearly report with AI...')
    try {
      const res = await $fetch<{
        success: boolean
        summary: string
        rows?: YearlyReportRow[]
        error?: string
      }>('/api/report/yearly/summary', {
        method: 'POST',
        body: { year: currentYear.value },
      })

      if (res.success) {
        yearlyHighlights.value = res.summary || ''
        if (res.rows && Array.isArray(res.rows)) {
          yearlyRows.value = res.rows
        }
        success('Yearly report generated!', { id: loadingToastId })
      } else {
        error(res.error || 'Failed to generate yearly report', { id: loadingToastId })
      }
    } catch (err: unknown) {
      console.error('Failed to generate AI summary:', err)
      error('AI service error', { id: loadingToastId })
    } finally {
      summarizing.value = false
    }
  }

  function addYearlyRow() {
    yearlyRows.value.push({
      tanggal: '',
      month: '',
      task: '',
      deliverable: 'Deliver',
      status: 'Done',
      keterangan: 'Project',
    })
  }

  function removeYearlyRow(idx: number) {
    yearlyRows.value.splice(idx, 1)
  }

  const copyYearlyReport = async () => {
    if (!yearlyRows.value.length) return
    let tsv = 'No\tTanggal\tPeriod\tTask\tDeliverable\tStatus\tKeterangan\n'
    yearlyRows.value.forEach((row, idx) => {
      tsv += `${idx + 1}\t${row.tanggal}\t${row.month}\t${row.task}\t${row.deliverable}\t${row.status}\t${row.keterangan}\n`
    })
    try {
      await navigator.clipboard.writeText(tsv)
      copiedYearly.value = true
      success('Yearly report copied to clipboard!')
    } catch {
      error('Failed to copy report.')
    }
    setTimeout(() => (copiedYearly.value = false), 2000)
  }

  watchDebounced(
    yearlyRows,
    async (newRows) => {
      if (newRows.length >= 0) {
        await $fetch('/api/report/yearly', {
          method: 'POST',
          body: { year: currentYear.value, rows: newRows, summary: yearlyHighlights.value },
        })
      }
    },
    { deep: true, debounce: 1000 },
  )

  return {
    isLoading,
    yearlyRows,
    yearlyHighlights,
    yearlyActivities,
    summarizing,
    copiedYearly,
    fetchingActivities,
    currentYear,
    fetchYearlyData,
    fetchYearlyActivities,
    generateAiSummary,
    addYearlyRow,
    removeYearlyRow,
    copyYearlyReport,
  }
})
