import { prisma } from './prisma'

export interface GitLabConfig {
  token: string;
  url: string;
}

export async function getGitLabConfig (): Promise<GitLabConfig> {
  const tokenSetting = await prisma.setting.findUnique({ where: { key: 'gitlab_token' } })
  const urlSetting = await prisma.setting.findUnique({ where: { key: 'gitlab_url' } })

  return {
    token: tokenSetting?.value || '',
    url: urlSetting?.value || 'https://gitlab.com'
  }
}

export async function fetchGitLab (path: string, config: GitLabConfig, query: any = {}) {
  if (!config.token) {
    throw new Error('GitLab Token not configured')
  }

  const url = `${config.url}/api/v4/${path.replace(/^\//, '')}`
  return await (globalThis as any).$fetch(url, {
    headers: { 'PRIVATE-TOKEN': config.token },
    query
  })
}

export async function getGitLabUser (config: GitLabConfig) {
  return await fetchGitLab('user', config)
}

export async function getGitLabProjects (config: GitLabConfig) {
  return await fetchGitLab('projects', config, {
    membership: true,
    simple: true,
    per_page: 100,
    order_by: 'last_activity_at'
  })
}

export async function getProjectDetails (config: GitLabConfig, projectId: number) {
  return await fetchGitLab(`projects/${projectId}`, config)
}

export async function getProjectCommits (config: GitLabConfig, projectId: number, query: { since?: string; until?: string; per_page?: number }) {
  return await fetchGitLab(`projects/${projectId}/repository/commits`, config, query)
}

export async function getCommitRefs (config: GitLabConfig, projectId: number, sha: string) {
  return await fetchGitLab(`projects/${projectId}/repository/commits/${sha}/refs`, config, { type: 'branch' })
}

export async function syncGitLabEvents (dateStr: string, force: boolean = false) {
  // Calculate Start and End of the month using date-fns
  const { startOfMonth, endOfMonth, parse, format } = await import('date-fns')
  const baseDate = parse(dateStr, 'yyyy-MM', new Date())
  const firstDay = format(startOfMonth(baseDate), 'yyyy-MM-dd')
  const lastDay = format(endOfMonth(baseDate), 'yyyy-MM-dd')

  const config = await getGitLabConfig()
  const projectsSetting = await prisma.setting.findUnique({ where: { key: 'gitlab_selected_projects' } })
  const selectedProjectIds = projectsSetting?.value ? projectsSetting.value.split(',').map(Number) : []

  if (!config.token) {
    throw new Error('GitLab Token not configured')
  }

  // 1. Fetch current user to filter commits by author
  const user: any = await getGitLabUser(config)
  const userEmail = user.email

  // 2. Try to load from Cache first
  if (!force) {
    const cacheEntry = await prisma.gitLabCache.findUnique({
      where: { date: dateStr }
    })

    if (cacheEntry) {
      return { success: true, events: JSON.parse(cacheEntry.data), date: dateStr, cached: true }
    }
  }

  // 3. Fetch commits for each selected project
  if (selectedProjectIds.length === 0) {
    return { success: true, events: [], date: dateStr, note: 'Please select projects in settings.' }
  }

  const commitPromises = selectedProjectIds.map(async (projectId: number) => {
    try {
      const project: any = await getProjectDetails(config, projectId)
      const commits: any[] = await getProjectCommits(config, projectId, {
        since: `${firstDay}T00:00:00+07:00`,
        until: `${lastDay}T23:59:59+07:00`,
        per_page: 100
      })

      const authoredCommits = (commits || []).filter(c => c.author_email === userEmail)

      const enrichedCommits = await Promise.all(
        authoredCommits.map(async (c) => {
          let branchNames: string[] = []

          try {
            const refs: any[] = await getCommitRefs(config, projectId, c.id)
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
  const allCommits = results.flat()

  // Save to cache
  await prisma.gitLabCache.upsert({
    where: { date: dateStr },
    update: { data: JSON.stringify(allCommits) },
    create: { date: dateStr, data: JSON.stringify(allCommits) }
  })

  return { success: true, events: allCommits, date: dateStr }
}
