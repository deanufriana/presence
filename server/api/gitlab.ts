export default defineEventHandler(async (event): Promise<any> => {
  const query = getQuery(event)
  const dateStr: string = (query.date as string) || new Date().toISOString().split('T')[0] || ''

  // Calculate Start and End of the month using date-fns
  const { startOfMonth, endOfMonth, parse, format } = await import('date-fns')
  const baseDate = parse(dateStr, 'yyyy-MM', new Date())
  const firstDay = format(startOfMonth(baseDate), 'yyyy-MM-dd')
  const lastDay = format(endOfMonth(baseDate), 'yyyy-MM-dd')

  const tokenSetting = await prisma.setting.findUnique({ where: { key: 'gitlab_token' } })
  const urlSetting = await prisma.setting.findUnique({ where: { key: 'gitlab_url' } })
  const projectsSetting = await prisma.setting.findUnique({ where: { key: 'gitlab_selected_projects' } })

  const gitlabToken = tokenSetting?.value
  const gitlabUrl = urlSetting?.value || 'https://gitlab.com'
  const selectedProjectIds = projectsSetting?.value ? projectsSetting.value.split(',').map(Number) : []

  try {
    // 1. Fetch current user to filter commits by author
    const userUrl: any = `${gitlabUrl}/api/v4/user`
    const user: any = await (globalThis as any).$fetch(userUrl, {
      headers: { 'PRIVATE-TOKEN': gitlabToken }
    })
    const userEmail = user.email

    let allCommits: any[] = []

    // 2. Try to load from Cache first (unless force refresh is requested)
    const force = query.force === 'true'
    if (!force) {
      const cacheEntry = await prisma.gitLabCache.findUnique({
        where: { date: dateStr }
      })

      if (cacheEntry) {
        return { success: true, events: JSON.parse(cacheEntry.data), date: dateStr, cached: true }
      }
    }

    // 3. Fetch commits for each selected project
    if (selectedProjectIds.length > 0) {
      const commitPromises = selectedProjectIds.map(async (projectId: number) => {
        try {
          const projectUrl: any = `${gitlabUrl}/api/v4/projects/${projectId}`
          const project: any = await (globalThis as any).$fetch(projectUrl, {
            headers: { 'PRIVATE-TOKEN': gitlabToken }
          })

          const commitsUrl: any = `${gitlabUrl}/api/v4/projects/${projectId}/repository/commits`
          const commits: any[] = await (globalThis as any).$fetch(commitsUrl, {
            headers: { 'PRIVATE-TOKEN': gitlabToken },
            query: {
              since: `${firstDay}T00:00:00+07:00`,
              until: `${lastDay}T23:59:59+07:00`,
              per_page: 100
            }
          })

          const authoredCommits = commits.filter(c => c.author_email === userEmail)

          const enrichedCommits = await Promise.all(
            authoredCommits.map(async (c) => {
              let branchNames: string[] = []

              try {
                const refsUrl: any = `${gitlabUrl}/api/v4/projects/${projectId}/repository/commits/${c.id}/refs`
                const refs: any[] = await (globalThis as any).$fetch(refsUrl, {
                  headers: { 'PRIVATE-TOKEN': gitlabToken },
                  query: { type: 'branch' }
                })
                branchNames = (refs || [])
                  .map((r: any) => r?.name)
                  .filter(Boolean)
              } catch {
                branchNames = []
              }

              return {
                ...c,
                project_name: project.name,
                project_path: project.path_with_namespace,
                project_id: projectId,
                branch_name: branchNames[0] || project.default_branch || null,
                branch_names: branchNames,
                action_name: 'pushed_commit'
              }
            })
          )

          return enrichedCommits
        } catch (e) {
          return []
        }
      })

      const results = await Promise.all(commitPromises)
      allCommits = results.flat()
      
      // Save to cache
      await prisma.gitLabCache.upsert({
        where: { date: dateStr },
        update: { data: JSON.stringify(allCommits) },
        create: { date: dateStr, data: JSON.stringify(allCommits) }
      })
    } else {
      return { success: true, events: [], date: dateStr, note: 'Please select projects in settings.' }
    }

    return { success: true, events: allCommits, date: dateStr }
  } catch (error: any) {
    return { success: false, error: error.message, events: [] }
  }
})
