import { defineStore } from 'pinia'

export const useJiraStore = defineStore('jira', () => {
  const jiraData = ref<any>(null)

  function setCache (cachedJira: any) {
    jiraData.value = cachedJira
  }

  async function fetchJiraCache () {
    const coreStore = useCoreStore()
    try {
      const res: any = await $fetch("/api/jira/cache" as any, { query: { date: coreStore.selectedDate } })
      if (res.success) {
        setCache(res.jira)
      }
    } catch (error) {
      console.error("Failed to fetch jira cache:", error)
    }
  }

  return {
    jiraData,
    setCache,
    fetchJiraCache,
  }
})
