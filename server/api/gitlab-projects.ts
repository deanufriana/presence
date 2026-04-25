export default defineEventHandler(async (event): Promise<any> => {
  const tokenSetting = await prisma.setting.findUnique({ where: { key: 'gitlab_token' } })
  const urlSetting = await prisma.setting.findUnique({ where: { key: 'gitlab_url' } })
  
  const gitlabToken = tokenSetting?.value
  const gitlabUrl = urlSetting?.value || 'https://gitlab.com'

  if (!gitlabToken) {
    return { error: 'GitLab Token not configured', projects: [] }
  }

  try {
    const projectsUrl: any = `${gitlabUrl}/api/v4/projects`
    const response: any = await (globalThis as any).$fetch(projectsUrl, {
      headers: { 'PRIVATE-TOKEN': gitlabToken },
      query: {
        membership: true,
        simple: true,
        per_page: 100,
        order_by: 'last_activity_at'
      }
    })

    return { 
      success: true, 
      projects: response.map((p: any) => ({
        id: p.id,
        name: p.name,
        path: p.path_with_namespace
      }))
    }
  } catch (error: any) {
    return { success: false, error: error.message, projects: [] }
  }
})
