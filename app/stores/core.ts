import { defineStore } from 'pinia'
import { format, addMonths, subMonths, parse } from "date-fns"
import { useToast } from "~/composables/use-toast"
import type { SettingsData } from '~/types/report'
import { useGitlabStore } from '~/stores/gitlab'
import { useCalendarStore } from '~/stores/calendar'
import { useDailyStore } from '~/stores/daily'
import { useMonthlyStore } from '~/stores/monthly'
import { useJiraStore } from '~/stores/jira'

export const useCoreStore = defineStore('core', () => {
  const { success, error } = useToast()
  const selectedDate = ref(format(new Date(), "yyyy-MM"))
  const showSettings = ref(false)
  const saving = ref(false)
  const initialLoading = ref(true)
  const isInitialized = ref(false)
  const pending = ref(false)
  const copied = ref(false)

  const settings = ref<SettingsData>({
    gitlab_token: "",
    gitlab_url: "https://gitlab.com",
    gitlab_selected_projects: "",
    jira_token: "",
    jira_url: "",
    jira_email: "",
    ai_api_key: "",
    openai_api_key: "",
    ai_provider: "gemini",
    ai_model: "gemini-2.0-flash-lite",
    ollama_url: "http://localhost:11434",
    user_name: "",
    user_position: "",
    user_nopeg: "",
    user_unit: "",
    user_function: "",
    team_leader_name: "Adhel Ekonofian",
    team_leader_position: "Team Leader",
    dept_head_name: "Septri Nur Ithmam",
    dept_head_position: "Department Head",
    div_head_name: "Ida Wahyuni Yanuarti",
    div_head_position: "Kepala Divisi Teknologi Informasi",
  })

  const isAiEnabled = computed(() => !!(settings.value.ai_api_key || settings.value.openai_api_key || settings.value.ai_provider === 'ollama'))

  async function loadCachedData () {
    initialLoading.value = true
    try {
      const [cachedGitlab, cachedCalendar, reportRes, monthlyRes, cachedJira]: any =
        await Promise.all([
          $fetch("/api/gitlab/cache" as any, { query: { date: selectedDate.value } }),
          $fetch("/api/calendar/cache" as any, { query: { date: selectedDate.value } }),
          $fetch("/api/report/daily" as any, { query: { date: selectedDate.value } }),
          $fetch("/api/report/monthly" as any, { query: { month: selectedDate.value } }),
          $fetch("/api/jira/cache" as any, { query: { date: selectedDate.value } }),
        ])

      useCalendarStore().setCache(cachedCalendar)
      useDailyStore().setCache(reportRes)
      useMonthlyStore().setCache(monthlyRes)
      useGitlabStore().setCache(cachedGitlab)
      useJiraStore().setCache(cachedJira)
    } catch (error) {
      console.error("Failed to load cached data:", error)
    } finally {
      initialLoading.value = false
    }
  }

  async function saveSettings () {
    saving.value = true
    try {
      const payload = {
        ...settings.value,
        gitlab_selected_projects: useGitlabStore().selectedProjectIds.join(","),
      }
      await $fetch("/api/settings" as any, {
        method: "POST",
        body: payload,
      })
      settings.value = payload
      success("Settings saved successfully")
      showSettings.value = false
    } catch (err) {
      console.error("Failed to save settings:", err)
      error("Failed to save settings")
    } finally {
      saving.value = false
    }
  }

  async function init () {
    if (isInitialized.value) return
    isInitialized.value = true
    const data: any = await $fetch("/api/settings" as any)
    if (data) {
      settings.value = { ...settings.value, ...data }
      if (settings.value.gitlab_selected_projects) {
        useGitlabStore().selectedProjectIds = settings.value.gitlab_selected_projects.split(",").map(Number)
      }
    }
    await loadCachedData()
  }

  function nextMonth() {
    const current = parse(selectedDate.value, "yyyy-MM", new Date())
    selectedDate.value = format(addMonths(current, 1), "yyyy-MM")
  }

  function prevMonth() {
    const current = parse(selectedDate.value, "yyyy-MM", new Date())
    // Basic validation to prevent going too far back if needed, 
    // but the picker will handle the strict "not before current month" rule.
    selectedDate.value = format(subMonths(current, 1), "yyyy-MM")
  }

  async function syncAllActivities (force = true) {
    pending.value = true
    try {
      const res: any = await $fetch(`/api/activities/${selectedDate.value}`, {
        query: { force: force ? "true" : "false" }
      })
      if (res.success) {
        useGitlabStore().setCache(res.gitlab)
        useJiraStore().setCache(res.jira)
        success("Activities synced successfully")
      }
    } catch (err) {
      console.error("Failed to sync activities:", err)
      error("Failed to sync activities")
    } finally {
      pending.value = false
    }
  }

  watch(selectedDate, () => {
    loadCachedData()
  })

  return {
    selectedDate,
    showSettings,
    saving,
    initialLoading,
    isInitialized,
    pending,
    copied,
    settings,
    isAiEnabled,
    loadCachedData,
    saveSettings,
    syncAllActivities,
    init,
    nextMonth,
    prevMonth,
  }
})
