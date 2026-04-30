import { defineStore } from 'pinia'
import { format, addMonths, subMonths, addYears, subYears, parse } from 'date-fns'
import { useToast } from '~/composables/use-toast'
import type { SettingsData } from '~/types/report'
import { useGitlabStore } from '~/stores/gitlab'
import { useJiraStore } from '~/stores/jira'
import { useCalendarStore } from '~/stores/calendar'
import { id } from 'date-fns/locale'

export const useCoreStore = defineStore('core', () => {
  const { success, error } = useToast()
  const selectedDate = ref(format(new Date(), 'yyyy-MM'))
  const showSettings = ref(false)
  const saving = ref(false)
  const initialLoading = ref(true)
  const isInitialized = ref(false)
  const pending = ref(false)
  const copied = ref(false)
  const viewMode = ref<'monthly' | 'yearly'>('monthly')
  const selectedProjectIds = ref<number[]>([])

  const settings = ref<SettingsData>({
    gitlab_token: '',
    gitlab_url: 'https://gitlab-ce.brilife.co.id',
    gitlab_selected_projects: '',
    jira_token: '',
    jira_url: '',
    jira_email: '',
    gemini_api_key: '',
    openai_api_key: '',
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
  })

  const isAiEnabled = computed(
    () =>
      !!(
        settings.value.gemini_api_key ||
        settings.value.openai_api_key ||
        settings.value.ai_provider === 'ollama'
      ),
  )

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

  async function saveSettings() {
    saving.value = true
    try {
      const payload = {
        ...settings.value,
        gitlab_selected_projects: selectedProjectIds.value.join(','),
      }

      const { upsertSettingsBatch } = await import('~/queries/settings')
      await upsertSettingsBatch(payload as Record<string, string>)

      settings.value = payload as SettingsData
      success('Settings saved successfully')
      showSettings.value = false
    } catch (err) {
      console.error('Failed to save settings:', err)
      error('Failed to save settings')
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

  async function syncAllActivities(force = true) {
    pending.value = true
    try {
      const { syncGitLabEvents } = await import('~/utils/gitlab')
      const { syncJiraActivities } = await import('~/utils/jira')

      const [gitlab, jira] = await Promise.all([
        syncGitLabEvents(selectedDate.value, force),
        syncJiraActivities(selectedDate.value, force),
      ])

      useGitlabStore().setCache(gitlab)
      useJiraStore().setCache(jira)
      success('Activities synced successfully')
    } catch (err) {
      console.error('Failed to sync activities:', err)
      error('Failed to sync activities')
    } finally {
      pending.value = false
    }
  }

  async function fetchAllActivities() {
    pending.value = true
    try {
      await Promise.all([
        useCalendarStore().fetchCalendarEvents(),
        useGitlabStore().fetchGitlabCache(),
        useJiraStore().fetchJiraCache(),
      ])
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
    initialLoading,
    isInitialized,
    pending,
    formatMonth,
    copied,
    settings,
    isAiEnabled,
    dateDisplay,
    selectedProjectIds,
    saveSettings,
    syncAllActivities,
    fetchAllActivities,
    fetchSettings,
    toggleProject,
    nextMonth,
    prevMonth,
    nextYear,
    prevYear,
    viewMode,
  }
})
