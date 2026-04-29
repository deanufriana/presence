import { defineStore } from 'pinia'
import { useToast } from '~/composables/use-toast'
import { useCoreStore } from '~/stores/core'

export const useGitlabStore = defineStore('gitlab', () => {
  const core = useCoreStore()
  const { error } = useToast()

  const gitlabData = ref<any>(null)
  const fetchingGitlab = ref(false)
  const fetchingProjects = ref(false)
  const allProjects = ref<{ id: number; name: string; path: string }[]>([])

  const filteredGitLab = computed(() => {
    if (!gitlabData.value?.events) return []
    const processed = new Set<string>()
    const results: string[] = []
    const events = Array.isArray(gitlabData.value.events) ? gitlabData.value.events : []

    for (const ev of events) {
      let desc = ""
      const action = ev.action_name?.toLowerCase() || ""
      const target = ev.target_type?.toLowerCase() || ""
      const project = ev.project_name || ev.target_title || "Project"

      if (action === "pushed_commit") {
        const projectLabel = ev.project_path || project
        const branchLabel = ev.branch_name ? ` (${ev.branch_name})` : ""
        desc = `[${projectLabel}]${branchLabel} ${ev.title}`
      } else if (action.includes("pushed") && ev.push_data) {
        const branch = ev.push_data.ref.replace("refs/heads/", "")
        desc = `Pushed to ${project} (${branch})`
      } else if (action === "opened" && target.includes("mergerequest")) {
        desc = `Opened MR: ${ev.target_title}`
      } else if (action === "merged" && target.includes("mergerequest")) {
        desc = `Merged MR: ${ev.target_title}`
      } else if (action === "accepted" && target.includes("mergerequest")) {
        desc = `Accepted MR: ${ev.target_title}`
      } else if (action === "commented on") {
        desc = `Commented on ${target}: ${ev.target_title || project}`
      } else {
        desc = `${ev.action_name} ${ev.target_type || ""} on ${project}`.trim()
      }

      if (desc && !processed.has(desc)) {
        processed.add(desc)
        results.push(desc)
      }
    }
    return results
  })

  function setCache (cachedGitlab: any) {
    gitlabData.value = cachedGitlab
  }

  const fetchGitlabCache = async () => {
    const res: any = await $fetch("/api/gitlab/cache" as any, { query: { date: core.selectedDate } })
    if (res.success) {
      useGitlabStore().setCache(res.gitlab)
    }
  }

  async function fetchProjects () {
    if (!core.settings.gitlab_token) {
      error("Please set GitLab Token first")
      return
    }
    fetchingProjects.value = true
    try {
      const data: any = await $fetch("/api/gitlab/projects" as any)
      allProjects.value = data.projects || []
    } catch (err) {
      console.error("Failed to fetch projects:", err)
      error("Failed to fetch GitLab projects")
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
