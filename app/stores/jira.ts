import { defineStore } from 'pinia'

export const useJiraStore = defineStore('jira', () => {
  const jiraData = ref<any>(null)

  function setCache (cachedJira: any) {
    jiraData.value = cachedJira
  }

  return {
    jiraData,
    setCache,
  }
})
