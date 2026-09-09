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
  const fetchingActivities = ref(false)
  const isLoading = ref(false)

  const currentYear = computed(() => core.selectedDate.split('-')[0] || '')

  async function fetchYearlyData() {
    isLoading.value = true
    try {
      const { getYearlyReport } = await import('~/utils/reports')
      const report = await getYearlyReport(currentYear.value)
      if (report) {
        yearlyRows.value = (report.rows as YearlyReportRow[]) || []
        yearlyHighlights.value = report.summary || ''
      }
    } catch (err: unknown) {
      console.error('Failed to fetch yearly data:', err)
      error('Failed to fetch yearly data')
    } finally {
      isLoading.value = false
    }
  }

  async function fetchYearlyActivities() {
    fetchingActivities.value = true
    try {
      const { getYearlyActivities } = await import('~/utils/reports')
      const months = await getYearlyActivities(currentYear.value)
      yearlyActivities.value = months || []
    } catch (err) {
      console.error('Failed to fetch yearly activities:', err)
    } finally {
      fetchingActivities.value = false
    }
  }

  async function generateAiSummary() {
    const provider = core.settings.ai_provider
    const apiKey = core.activeApiKey

    if (provider !== 'ollama' && (!apiKey || !apiKey.trim())) {
      error(`API key for '${provider}' is not configured. Please set it in Settings first.`)
      return
    }

    summarizing.value = true
    const loadingToastId = loading('Generating yearly report with AI...')
    try {
      const { getAllMonthlySummaries, parseYearlyMarkdown, upsertYearlyReport } =
        await import('~/utils/reports')
      const { generateSummary } = await import('~/utils/ai')
      const { getYearlyPrompt } = await import('~/utils/prompts')

      const summaries = await getAllMonthlySummaries(currentYear.value)
      const prompt = getYearlyPrompt(summaries)
      const rawContent = await generateSummary(prompt, {
        max_tokens: 4000,
        provider: core.settings.ai_provider,
        model: core.settings.ai_model,
        apiKey: core.activeApiKey,
        ollamaUrl: core.settings.ollama_url,
      })

      const rows = parseYearlyMarkdown(rawContent)
      const report = await upsertYearlyReport({
        year: currentYear.value,
        summary: rawContent.trim(),
        rows,
      })

      if (report) {
        yearlyHighlights.value = report.summary
        yearlyRows.value = report.rows as YearlyReportRow[]
        success('Yearly report generated!', { id: loadingToastId })
      }
    } catch (err: unknown) {
      console.error('Failed to generate AI summary:', err)
      error('AI service error', {
        id: loadingToastId,
        description: (err as Error)?.message || String(err),
      })
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

  watchDebounced(
    [yearlyRows, yearlyHighlights],
    async ([newRows, newSummary]) => {
      if (newRows.length > 0) {
        const { upsertYearlyReport } = await import('~/utils/reports')
        await upsertYearlyReport({
          year: currentYear.value,
          rows: newRows as YearlyReportRow[],
          summary: newSummary as string,
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
    fetchingActivities,
    currentYear,
    fetchYearlyData,
    fetchYearlyActivities,
    generateAiSummary,
    addYearlyRow,
    removeYearlyRow,
  }
})
