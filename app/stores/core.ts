import { defineStore } from 'pinia'
import { format } from "date-fns"
import { useToast } from "~/composables/use-toast"
import type { SettingsData } from '~/types/report'
import { useGitlabStore } from '~/stores/gitlab'
import { useCalendarStore } from '~/stores/calendar'
import { useDailyStore } from '~/stores/daily'
import { useMonthlyStore } from '~/stores/monthly'

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
  })

  const isAiEnabled = computed(() => !!(settings.value.ai_api_key || settings.value.openai_api_key || settings.value.ai_provider === 'ollama'))

  async function loadCachedData () {
    initialLoading.value = true
    try {
      const [cachedGitlab, cachedCalendar, reportRes, monthlyRes]: any =
        await Promise.all([
          $fetch("/api/gitlab/cache" as any, { query: { date: selectedDate.value } }),
          $fetch("/api/calendar/cache" as any, { query: { date: selectedDate.value } }),
          $fetch("/api/report/daily" as any, { query: { date: selectedDate.value } }),
          $fetch("/api/report/monthly" as any, { query: { month: selectedDate.value } }),
        ])

      useGitlabStore().setCache(cachedGitlab)
      useCalendarStore().setCache(cachedCalendar)
      useDailyStore().setCache(reportRes)
      useMonthlyStore().setCache(monthlyRes)
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
    init,
  }
})
