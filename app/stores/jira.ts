import { defineStore } from 'pinia'
import type { MonthlyReportRow, JiraChildTask } from '~/types/report'
import type { JiraCache, JiraEvent } from '~/types/jira'
import type { JiraProject, JiraIssueType, JiraMyself, JiraConfig } from '~/utils/jira'

export const useJiraStore = defineStore('jira', () => {
  const jiraData = ref<JiraCache | null>(null)

  // State for row-level Jira issue creation modal
  const showExportModal = ref(false)
  const exportRow = ref<MonthlyReportRow | null>(null)
  const exportPeriod = ref('')
  const candidateParents = ref<JiraEvent[]>([])
  const exportRowActivities = ref<string[]>([])
  const exportDescription = ref('')
  const exportChildTasks = ref<JiraChildTask[]>([])
  const exportProjectKey = ref('')

  // Cached metadata to avoid redundant API calls
  const cachedProjects = ref<JiraProject[]>([])
  const cachedIssueTypes = ref<JiraIssueType[]>([])
  const cachedMyself = ref<JiraMyself | null>(null)
  const loadingMetadata = ref(false)

  function setCache(cachedJira: JiraCache) {
    jiraData.value = cachedJira
  }

  async function fetchJiraCache() {
    const coreStore = useCoreStore()
    try {
      const { getJiraCache } = await import('~/utils/jira')
      const res = await getJiraCache(coreStore.selectedDate)
      if (res.success) {
        setCache(res)
      }
    } catch (error) {
      console.error('Failed to fetch jira cache:', error)
      const { error: toastError } = useToast()
      toastError('Failed to sync Jira activities')
    }
  }

  async function loadJiraMetadata(config: JiraConfig, force = false) {
    if (
      cachedProjects.value.length > 0 &&
      cachedIssueTypes.value.length > 0 &&
      cachedMyself.value &&
      !force
    ) {
      return
    }

    loadingMetadata.value = true
    try {
      const { getJiraProjects, getJiraIssueTypes, getJiraMyself } = await import('~/utils/jira')
      const [projs, myself, allTypes] = await Promise.all([
        getJiraProjects(config).catch((err) => {
          console.error('Failed to fetch Jira projects:', err)
          return [] as JiraProject[]
        }),
        getJiraMyself(config).catch((err) => {
          console.error('Failed to fetch myself profile:', err)
          return null
        }),
        getJiraIssueTypes(config).catch((err) => {
          console.error('Failed to fetch Jira issue types:', err)
          return [] as JiraIssueType[]
        }),
      ])

      cachedProjects.value = projs || []
      cachedMyself.value = myself
      cachedIssueTypes.value = allTypes || []
    } catch (err) {
      console.error('Failed to load Jira metadata:', err)
      throw err
    } finally {
      loadingMetadata.value = false
    }
  }

  async function triggerRowJiraExport(row: MonthlyReportRow, period: string) {
    exportRow.value = row
    exportPeriod.value = period
    candidateParents.value = []
    exportRowActivities.value = []
    exportDescription.value = ''
    exportChildTasks.value = []

    // Extract stable project key from bracket prefix [PROJ]
    const { extractProjectKey } = await import('~/utils/format')
    exportProjectKey.value = extractProjectKey(row.project || '')

    // Load pre-generated Jira export data from DB using stable project key
    try {
      const { getJiraExportData } = await import('~/queries/jiraExport')
      const saved = await getJiraExportData(period, row.project || '')
      if (saved) {
        exportDescription.value = saved.description || ''
        if (saved.childTasks) {
          try {
            const parsed = JSON.parse(saved.childTasks)
            if (Array.isArray(parsed)) {
              exportChildTasks.value = parsed as JiraChildTask[]
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err) {
      console.error('Failed to load Jira export data:', err)
    }

    if (row.sources && row.sources.length > 0) {
      try {
        const { getJiraActivitiesByDates } = await import('~/queries/jira')
        const { getDailyActivitiesByDates } = await import('~/queries/reports')

        const [activities, dailyReports] = await Promise.all([
          getJiraActivitiesByDates(row.sources),
          getDailyActivitiesByDates(row.sources),
        ])

        candidateParents.value = activities.map((a) => ({
          id: a.id,
          key: a.key,
          summary: a.summary,
          type: a.type,
          status: a.status,
          project_name: a.projectName,
          updated_at: a.updatedAt.toISOString(),
          user_email: a.userEmail,
          web_url: a.webUrl,
        }))

        const parsedActivities: string[] = []
        dailyReports.forEach((report) => {
          if (report.aktivitas) {
            const lines = report.aktivitas
              .split('\n')
              .map((line) => line.trim())
              .map((line) => line.replace(/^[-*•]\s*/, ''))
              .map((line) => line.trim())
              .filter((line) => line.length > 2)
            parsedActivities.push(...lines)
          }
        })
        exportRowActivities.value = Array.from(new Set(parsedActivities))
      } catch (err) {
        console.error('Failed to fetch candidate parents or daily activities:', err)
        const { error: toastError } = useToast()
        toastError('Failed to load activities for Jira export')
        return
      }
    }

    showExportModal.value = true
  }

  return {
    jiraData,
    setCache,
    fetchJiraCache,
    showExportModal,
    exportRow,
    exportPeriod,
    candidateParents,
    exportRowActivities,
    exportDescription,
    exportChildTasks,
    exportProjectKey,
    triggerRowJiraExport,
    // Cached metadata
    cachedProjects,
    cachedIssueTypes,
    cachedMyself,
    loadingMetadata,
    loadJiraMetadata,
  }
})
