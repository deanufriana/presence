import { defineStore } from 'pinia'
import { useToast } from '~/composables/use-toast'
import { useCoreStore } from '~/stores/core'
import type { GitlabCache, GitLabEvent } from '~/types/report'

export const useGitlabStore = defineStore('gitlab', () => {
  const core = useCoreStore()
  const { error } = useToast()

  const gitlabData = ref<GitlabCache | null>(null)
  const fetchingGitlab = ref(false)
  const fetchingProjects = ref(false)
  const allProjects = ref<{ id: number; name: string; path: string }[]>([])

  const filteredGitLab = computed(() => {
    if (!gitlabData.value?.events) return []
    const processed = new Set<string>()
    const results: string[] = []
    const events = gitlabData.value.events as GitLabEvent[]

    for (const ev of events) {
      let desc = ''
      const action = ev.action_name?.toLowerCase() || ''
      const target = ev.target_type?.toLowerCase() || ''
      const project = ev.project_name || ev.target_title || 'Project'

      if (action === 'pushed_commit') {
        const projectLabel = ev.project_path || project
        const branchLabel = ev.branch_name ? ` (${ev.branch_name})` : ''
        desc = `[${projectLabel}]${branchLabel} ${ev.title}`
      } else if (action.includes('pushed') && ev.push_data) {
        const branch = ev.push_data.ref.replace('refs/heads/', '')
        desc = `Pushed to ${project} (${branch})`
      } else if (action === 'opened' && target.includes('mergerequest')) {
        desc = `Opened MR: ${ev.target_title}`
      } else if (action === 'merged' && target.includes('mergerequest')) {
        desc = `Merged MR: ${ev.target_title}`
      } else if (action === 'accepted' && target.includes('mergerequest')) {
        desc = `Accepted MR: ${ev.target_title}`
      } else if (action === 'commented on') {
        desc = `Commented on ${target}: ${ev.target_title || project}`
      } else {
        desc = `${ev.action_name} ${ev.target_type || ''} on ${project}`.trim()
      }

      if (desc && !processed.has(desc)) {
        processed.add(desc)
        results.push(desc)
      }
    }
    return results
  })

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
        url: core.settings.gitlab_url?.trim() || 'https://gitlab.com',
      }

      if (!config.token) {
        error('GitLab Token is empty. Please type your token first.')
        return
      }

      const projects = await getGitLabProjects(config)
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
    fetchingGitlab,
    fetchingProjects,
    allProjects,
    filteredGitLab,
    fetchGitlabCache,
    setCache,
    fetchProjects,
  }
})
