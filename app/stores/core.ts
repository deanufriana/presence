import { defineStore } from 'pinia'
import { format, addMonths, subMonths, addYears, subYears, parse } from 'date-fns'
import { useToast } from '~/composables/use-toast'
import type { SettingsData } from '~/types/settings'
import { useGitlabStore } from '~/stores/gitlab'
import { useJiraStore } from '~/stores/jira'
import { useCalendarStore } from '~/stores/calendar'
import { id } from 'date-fns/locale'

export const useCoreStore = defineStore('core', () => {
  const { success, error } = useToast()
  const selectedDate = ref(format(new Date(), 'yyyy-MM'))
  const showSettings = ref(false)
  const saving = ref(false)
  const pending = ref(false)
  const viewMode = ref<'monthly' | 'yearly'>('monthly')
  const selectedProjectIds = ref<number[]>([])
  const selectedJiraProjects = ref<string[]>([])

  const settings = ref<SettingsData>({
    gitlab_token: '',
    gitlab_url: 'https://gitlab-ce.brilife.co.id',
    gitlab_selected_projects: '',
    jira_token: '',
    jira_url: '',
    jira_email: '',
    gemini_api_key: '',
    openai_api_key: '',
    deepseek_api_key: '',
    ai_provider: 'gemini',
    ai_model: 'gemini-2.0-flash-lite',
    ollama_url: 'http://localhost:11434',
    user_name: '',
    user_position: '',
    user_nopeg: '',
    user_unit: '',
    user_function: '',
    team_leader_name: 'Adhel Ekonofian',
    team_leader_position: 'Team Leader',
    dept_head_name: 'Septri Nur Ithmam',
    dept_head_position: 'Department Head',
    div_head_name: 'Ida Wahyuni Yanuarti',
    div_head_position: 'Kepala Divisi Teknologi Informasi',
    jira_default_project: '',
    jira_default_issuetype: '',
    jira_selected_projects: '',
  })

  const isAiEnabled = computed(
    () =>
      !!(
        settings.value.gemini_api_key ||
        settings.value.openai_api_key ||
        settings.value.deepseek_api_key ||
        settings.value.ai_provider === 'ollama'
      ),
  )

  const activeApiKey = computed(() => {
    const provider = settings.value.ai_provider
    if (provider === 'gemini') return settings.value.gemini_api_key
    if (provider === 'openai') return settings.value.openai_api_key
    if (provider === 'deepseek') return settings.value.deepseek_api_key
    return undefined
  })

  const dateDisplay = computed(() => {
    try {
      const d = parse(selectedDate.value, 'yyyy-MM', new Date())
      return format(d, 'MMMM yyyy', { locale: id })
    } catch {
      return selectedDate.value
    }
  })

  const formatMonth = computed(() => {
    try {
      const d = parse(selectedDate.value, 'yyyy-MM', new Date())
      return format(d, 'MMMM', { locale: id })
    } catch {
      return selectedDate.value
    }
  })

  function toggleProject(id: number) {
    const index = selectedProjectIds.value.indexOf(id)
    if (index === -1) {
      selectedProjectIds.value.push(id)
    } else {
      selectedProjectIds.value.splice(index, 1)
    }
  }

  function toggleJiraProject(key: string) {
    const index = selectedJiraProjects.value.indexOf(key)
    if (index === -1) {
      selectedJiraProjects.value.push(key)
    } else {
      selectedJiraProjects.value.splice(index, 1)
    }
  }

  async function saveSettings(): Promise<boolean> {
    saving.value = true
    try {
      const payload = {
        ...settings.value,
        gitlab_selected_projects: selectedProjectIds.value.join(','),
        jira_selected_projects: selectedJiraProjects.value.join(','),
      }

      const { upsertSettingsBatch } = await import('~/queries/settings')
      await upsertSettingsBatch(payload as Record<string, string>)

      settings.value = payload as SettingsData
      success('Settings saved successfully')
      showSettings.value = false
      return true
    } catch (err) {
      console.error('Failed to save settings:', err)
      error('Failed to save settings')
      return false
    } finally {
      saving.value = false
    }
  }

  async function fetchSettings() {
    try {
      const { fetchAllSettings } = await import('~/queries/settings')
      const data = await fetchAllSettings()

      if (Object.keys(data).length > 0) {
        settings.value = { ...settings.value, ...data }
        if (settings.value.gitlab_selected_projects) {
          selectedProjectIds.value = settings.value.gitlab_selected_projects
            .split(',')
            .map((id: string) => parseInt(id))
            .filter((id: number) => !isNaN(id))
        }
        if (settings.value.jira_selected_projects) {
          selectedJiraProjects.value = settings.value.jira_selected_projects
            .split(',')
            .filter((k: string) => k.trim().length > 0)
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err)
    }
  }

  function nextMonth() {
    const current = parse(selectedDate.value, 'yyyy-MM', new Date())
    selectedDate.value = format(addMonths(current, 1), 'yyyy-MM')
  }

  function prevMonth() {
    const current = parse(selectedDate.value, 'yyyy-MM', new Date())
    selectedDate.value = format(subMonths(current, 1), 'yyyy-MM')
  }

  function nextYear() {
    const current = parse(selectedDate.value, 'yyyy-MM', new Date())
    selectedDate.value = format(addYears(current, 1), 'yyyy-MM')
  }

  function prevYear() {
    const current = parse(selectedDate.value, 'yyyy-MM', new Date())
    selectedDate.value = format(subYears(current, 1), 'yyyy-MM')
  }

  /** Re-reads every activity cache from the local DB. Assumes `pending` is already handled. */
  async function refreshActivityCaches() {
    await Promise.all([
      useCalendarStore().fetchCalendarEvents(),
      useGitlabStore().fetchGitlabCache(),
      useJiraStore().fetchJiraCache(),
    ])
  }

  async function fetchAllActivities() {
    pending.value = true
    try {
      await refreshActivityCaches()
    } catch (err) {
      console.error('Failed to sync activities:', err)
      error('Failed to sync activities')
    } finally {
      pending.value = false
    }
  }

  /**
   * Pulls fresh data from the configured sources. Defaults to syncing both, so
   * existing callers that pass only `force` keep their current behaviour.
   *
   * Calendar is intentionally absent: it has no remote source, it is populated
   * by importing an .ics file, so it is refreshed from the DB instead.
   */
  async function syncAllActivities(force = true, sources?: { gitlab?: boolean; jira?: boolean }) {
    const wantGitLab = sources?.gitlab ?? true
    const wantJira = sources?.jira ?? true

    if (!wantGitLab && !wantJira) {
      error('Select at least one source to sync')
      return
    }

    pending.value = true
    try {
      const jobs: Promise<void>[] = []

      if (wantGitLab) {
        jobs.push(
          (async () => {
            const { syncGitLabEvents } = await import('~/utils/gitlab')
            const gitlab = await syncGitLabEvents(selectedDate.value, force)
            useGitlabStore().setCache(gitlab)
          })(),
        )
      }

      if (wantJira) {
        jobs.push(
          (async () => {
            const { syncJiraActivities } = await import('~/utils/jira')
            const jira = await syncJiraActivities(selectedDate.value, force)
            useJiraStore().setCache(jira)
          })(),
        )
      }

      await Promise.all(jobs)
      // Re-read every cache so the sources left untouched stay consistent with the DB.
      await refreshActivityCaches()

      const synced = [wantGitLab && 'GitLab', wantJira && 'Jira'].filter(Boolean).join(' + ')
      success(`${synced} synced successfully`)
    } catch (err) {
      console.error('Failed to sync activities:', err)
      error('Failed to sync activities')
    } finally {
      pending.value = false
    }
  }

  return {
    selectedDate,
    showSettings,
    saving,
    pending,
    formatMonth,
    settings,
    isAiEnabled,
    activeApiKey,
    dateDisplay,
    selectedProjectIds,
    selectedJiraProjects,
    saveSettings,
    syncAllActivities,
    fetchAllActivities,
    fetchSettings,
    toggleProject,
    toggleJiraProject,
    nextMonth,
    prevMonth,
    nextYear,
    prevYear,
    viewMode,
  }
})
