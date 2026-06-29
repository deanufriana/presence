import { defineStore } from 'pinia'
import { useCoreStore } from '~/stores/core'
import { useToast } from '~/composables/use-toast'
import type { MonthlyReportRow, JiraChildTask } from '~/types/report'
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
      const { getMonthlyReport } = await import('~/utils/reports')
      const report = await getMonthlyReport(core.selectedDate)
      if (report) {
        monthlyRows.value = (report.rows as MonthlyReportRow[]) || []
        monthlyHighlights.value = report.summary || ''
      }
    } catch (err: unknown) {
      console.error('Failed to fetch monthly report:', err)
      error('Failed to fetch monthly report')
    } finally {
      isLoading.value = false
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
    const loadingToastId = loading('Generating monthly report with AI...')
    try {
      const { getDailyReports, parseMonthlyMarkdown, upsertMonthlyReport } =
        await import('~/utils/reports')
      const { generateSummary } = await import('~/utils/ai')
      const { getMonthlyPrompt } = await import('~/utils/prompts')

      const dailyReports = await getDailyReports(core.selectedDate)
      const activities = dailyReports
        .map((r) => `[Date: ${r.date}] ${r.aktivitas}`)
        .filter((act): act is string => !!act && act.length > 5)

      if (activities.length === 0) {
        error('No activities found for this month', { id: loadingToastId })
        return
      }

      const prompt = getMonthlyPrompt(activities)
      const rawContent = await generateSummary(prompt, {
        max_tokens: 3000,
        provider: core.settings.ai_provider,
        model: core.settings.ai_model,
        apiKey: core.activeApiKey,
        ollamaUrl: core.settings.ollama_url,
      })

      const rows = parseMonthlyMarkdown(rawContent)
      const report = await upsertMonthlyReport({
        month: core.selectedDate,
        summary: rawContent.trim(),
        rows,
      })

      if (report) {
        monthlyHighlights.value = report.summary
        monthlyRows.value = report.rows as MonthlyReportRow[]
      }

      // Generate Jira export data inline (inside loading toast)
      if (rows.length > 0) {
        await generateJiraExportData(activities, rows, report?.summary)
      }

      success('Monthly report and table generated!', { id: loadingToastId })
    } catch (err: unknown) {
      console.error('Failed to generate AI summary:', err)
      error('AI service error', { id: loadingToastId })
    } finally {
      summarizing.value = false
    }
  }

  async function generateJiraExportData(
    activities: string[],
    rows: { project: string; sources?: string[] }[],
    monthlySummary?: string,
  ) {
    try {
      const { generateSummary } = await import('~/utils/ai')
      const { getJiraExportPrompt } = await import('~/utils/prompts')
      const { upsertJiraExportData } = await import('~/queries/jiraExport')

      const jiraPrompt = getJiraExportPrompt(activities, rows, monthlySummary)
      const jiraRaw = await generateSummary(jiraPrompt, {
        max_tokens: 8192,
        temperature: 0.2,
        provider: core.settings.ai_provider,
        model: core.settings.ai_model,
        apiKey: core.activeApiKey,
        ollamaUrl: core.settings.ollama_url,
      })

      const { stripMarkdownCodeBlock } = await import('~/utils/format')
      const clean = stripMarkdownCodeBlock(jiraRaw)

      const jiraData = JSON.parse(clean) as {
        project: string
        description: string
        childTasks: JiraChildTask[]
      }[]

      if (!Array.isArray(jiraData)) return

      for (const item of jiraData) {
        if (!item.project) continue
        const childTasks = (item.childTasks || []).map((ct) => ({
          title: ct.title || '',
          description: ct.description || '',
        }))
        await upsertJiraExportData({
          month: core.selectedDate,
          project: item.project,
          description: item.description || null,
          childTasks: JSON.stringify(childTasks),
        })
      }
    } catch (err) {
      console.error('Failed to generate/save Jira export data:', err)
      error('Failed to prepare Jira descriptions')
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
    [monthlyRows, monthlyHighlights],
    async ([newRows, newSummary]) => {
      if (newRows.length > 0) {
        const { upsertMonthlyReport } = await import('~/utils/reports')
        await upsertMonthlyReport({
          month: core.selectedDate,
          rows: newRows as MonthlyReportRow[],
          summary: newSummary as string,
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
