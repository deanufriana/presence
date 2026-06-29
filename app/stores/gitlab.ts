import { defineStore } from 'pinia'
import { useToast } from '~/composables/use-toast'
import { useCoreStore } from '~/stores/core'
import type { GitlabCache } from '~/types/gitlab'

export const useGitlabStore = defineStore('gitlab', () => {
  const core = useCoreStore()
  const { error } = useToast()

  const gitlabData = ref<GitlabCache | null>(null)
  const fetchingProjects = ref(false)
  const allProjects = ref<{ id: number; name: string; path: string }[]>([])

  function setCache(cachedGitlab: GitlabCache) {
    gitlabData.value = cachedGitlab
  }

  const fetchGitlabCache = async () => {
    try {
      const { getGitLabCache } = await import('~/utils/gitlab')
      const res = await getGitLabCache(core.selectedDate)
      if (res.success) {
        setCache(res as GitlabCache)
      }
    } catch (err) {
      console.error('Failed to fetch gitlab cache:', err)
    }
  }

  async function fetchProjects() {
    if (!core.settings.gitlab_token) {
      error('Please set GitLab Token first')
      return
    }
    fetchingProjects.value = true
    try {
      const { getGitLabProjects } = await import('~/utils/gitlab')
      const config = {
        token: core.settings.gitlab_token?.trim() || '',
        url: core.settings.gitlab_url?.trim() || 'https://gitlab-ce.brilife.co.id',
      }

      if (!config.token) {
        error('GitLab Token is empty. Please type your token first.')
        return
      }

      const projects = await getGitLabProjects()
      allProjects.value =
        projects.map((p) => ({
          id: p.id,
          name: p.name,
          path: p.path_with_namespace,
        })) || []
    } catch (err) {
      console.error('Failed to fetch projects:', err)
      error('Failed to fetch GitLab projects')
    } finally {
      fetchingProjects.value = false
    }
  }

  return {
    gitlabData,
    fetchingProjects,
    allProjects,
    fetchGitlabCache,
    setCache,
    fetchProjects,
  }
})
