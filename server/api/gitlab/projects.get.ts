export default defineEventHandler(async (event): Promise<any> => {
  const config = await getGitLabConfig()

  if (!config.token) {
    return { error: 'GitLab Token not configured', projects: [] }
  }

  try {
    const response: any = await getGitLabProjects(config)

    return {
      success: true,
      projects: (response || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        path: p.path_with_namespace
      }))
    }
  } catch (error: any) {
    return { success: false, error: error.message, projects: [] }
  }
})
