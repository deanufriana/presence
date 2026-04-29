import { getGitLabConfig, getGitLabProjects, type RawGitLabProject } from '../../utils/gitlab'

export default defineEventHandler(async (_) => {
  const config = await getGitLabConfig()

  if (!config.token) {
    return { error: 'GitLab Token not configured', projects: [] }
  }

  try {
    const response = await getGitLabProjects(config)

    return {
      success: true,
      projects: (response || []).map((p: RawGitLabProject) => ({
        id: p.id,
        name: p.name,
        path: p.path_with_namespace,
      })),
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return { success: false, error: msg, projects: [] }
  }
})
