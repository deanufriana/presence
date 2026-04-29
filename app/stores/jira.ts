import { defineStore } from 'pinia'
import type { JiraCache } from '~/types/report'

export const useJiraStore = defineStore('jira', () => {
  const jiraData = ref<JiraCache | null>(null)

  function setCache(cachedJira: JiraCache) {
    jiraData.value = cachedJira
  }

  async function fetchJiraCache() {
    const coreStore = useCoreStore()
    try {
      const res = await $fetch<JiraCache>('/api/jira/cache', {
        query: { date: coreStore.selectedDate },
      })
      if (res.success) {
        setCache(res)
      }
    } catch (error) {
      console.error('Failed to fetch jira cache:', error)
    }
  }

  return {
    jiraData,
    setCache,
    fetchJiraCache,
  }
})
