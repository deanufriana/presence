import { prisma } from './prisma'

export interface GitLabConfig {
  token: string
  url: string
}

export interface RawGitLabUser {
  id: number
  username: string
  email: string
  name: string
}

export interface RawGitLabProject {
  id: number
  name: string
  path_with_namespace: string
  default_branch?: string
}

export interface RawGitLabCommit {
  id: string
  short_id: string
  title: string
  message: string
  author_name: string
  author_email: string
  authored_date: string
  committer_name: string
  committer_email: string
  committed_date: string
  web_url: string
  created_at: string
}

export interface RawGitLabRef {
  name: string
  type: string
}

export async function getGitLabConfig(): Promise<GitLabConfig> {
  const tokenSetting = await prisma.setting.findUnique({ where: { key: 'gitlab_token' } })
  const urlSetting = await prisma.setting.findUnique({ where: { key: 'gitlab_url' } })

  return {
    token: tokenSetting?.value || '',
    url: urlSetting?.value || 'https://gitlab.com',
  }
}

export async function fetchGitLab<T = unknown>(
  path: string,
  config: GitLabConfig,
  query: Record<string, string | number | boolean> = {},
): Promise<T> {
  if (!config.token) {
    throw new Error('GitLab Token not configured')
  }

  const url = `${config.url}/api/v4/${path.replace(/^\//, '')}`
  return await $fetch<T>(url, {
    headers: { 'PRIVATE-TOKEN': config.token },
    query,
  })
}

export async function getGitLabUser(config: GitLabConfig): Promise<RawGitLabUser> {
  return await fetchGitLab<RawGitLabUser>('user', config)
}

export async function getGitLabProjects(config: GitLabConfig): Promise<RawGitLabProject[]> {
  return await fetchGitLab<RawGitLabProject[]>('projects', config, {
    membership: true,
    simple: true,
    per_page: 100,
    order_by: 'last_activity_at',
  })
}

export async function getProjectDetails(
  config: GitLabConfig,
  projectId: number,
): Promise<RawGitLabProject> {
  return await fetchGitLab<RawGitLabProject>(`projects/${projectId}`, config)
}

export async function getProjectCommits(
  config: GitLabConfig,
  projectId: number,
  query: { since?: string; until?: string; per_page?: number },
): Promise<RawGitLabCommit[]> {
  return await fetchGitLab<RawGitLabCommit[]>(
    `projects/${projectId}/repository/commits`,
    config,
    query as Record<string, string | number | boolean>,
  )
}

export async function getCommitRefs(
  config: GitLabConfig,
  projectId: number,
  sha: string,
): Promise<RawGitLabRef[]> {
  return await fetchGitLab<RawGitLabRef[]>(
    `projects/${projectId}/repository/commits/${sha}/refs`,
    config,
    { type: 'branch' },
  )
}

export async function syncGitLabEvents(dateStr: string, force: boolean = false) {
  // Calculate Start and End of the month using date-fns
  const { startOfMonth, endOfMonth, parse, format } = await import('date-fns')
  const baseDate = parse(dateStr, 'yyyy-MM', new Date())
  const firstDay = format(startOfMonth(baseDate), 'yyyy-MM-dd')
  const lastDay = format(endOfMonth(baseDate), 'yyyy-MM-dd')

  const config = await getGitLabConfig()
  const projectsSetting = await prisma.setting.findUnique({
    where: { key: 'gitlab_selected_projects' },
  })
  const selectedProjectIds = projectsSetting?.value
    ? projectsSetting.value.split(',').map(Number)
    : []

  if (!config.token) {
    throw new Error('GitLab Token not configured')
  }

  // 1. Fetch current user to filter commits by author
  const user = await getGitLabUser(config)
  const userEmail = user.email

  // 2. Try to load from Cache first
  if (!force) {
    const existingCommits = await getGitLabCache(dateStr)
    if (existingCommits.events.length > 0) {
      return { ...existingCommits, cached: true }
    }
  }

  // 3. Fetch commits for each selected project
  if (selectedProjectIds.length === 0) {
    return { success: true, events: [], date: dateStr, note: 'Please select projects in settings.' }
  }

  const commitPromises = selectedProjectIds.map(async (projectId: number) => {
    try {
      const project = await getProjectDetails(config, projectId)
      const commits = await getProjectCommits(config, projectId, {
        since: `${firstDay}T00:00:00+07:00`,
        until: `${lastDay}T23:59:59+07:00`,
        per_page: 100,
      })

      const authoredCommits = (commits || []).filter((c) => c.author_email === userEmail)

      const enrichedCommits = await Promise.all(
        authoredCommits.map(async (c) => {
          let branchNames: string[] = []

          try {
            const refs = await getCommitRefs(config, projectId, c.id)
            branchNames = (refs || []).map((r) => r?.name).filter(Boolean)
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
            action_name: 'pushed_commit',
          }
        }),
      )

      return enrichedCommits
    } catch {
      return []
    }
  })

  const results = await Promise.all(commitPromises)
  const allCommits = results.flat()

  // Save to database
  await Promise.all(
    allCommits.map(async (commit) => {
      await prisma.gitLabCommit.upsert({
        where: { id: commit.id },
        update: {
          shortId: commit.short_id,
          title: commit.title,
          message: commit.message,
          authorName: commit.author_name,
          authorEmail: commit.author_email,
          authoredDate: new Date(commit.authored_date),
          committerName: commit.committer_name,
          committerEmail: commit.committer_email,
          committedDate: new Date(commit.committed_date),
          webUrl: commit.web_url,
          projectName: commit.project_name,
          projectPath: commit.project_path,
          projectId: commit.project_id,
          branchName: commit.branch_name,
          branchNames: JSON.stringify(commit.branch_names),
          actionName: commit.action_name,
          createdAt: new Date(commit.created_at),
        },
        create: {
          id: commit.id,
          shortId: commit.short_id,
          title: commit.title,
          message: commit.message,
          authorName: commit.author_name,
          authorEmail: commit.author_email,
          authoredDate: new Date(commit.authored_date),
          committerName: commit.committer_name,
          committerEmail: commit.committer_email,
          committedDate: new Date(commit.committed_date),
          webUrl: commit.web_url,
          projectName: commit.project_name,
          projectPath: commit.project_path,
          projectId: commit.project_id,
          branchName: commit.branch_name,
          branchNames: JSON.stringify(commit.branch_names),
          actionName: commit.action_name,
          createdAt: new Date(commit.created_at),
        },
      })
    }),
  )

  return { success: true, events: allCommits, date: dateStr }
}

export async function getGitLabCache(dateStr: string) {
  const { startOfMonth, endOfMonth, parse } = await import('date-fns')
  const baseDate = parse(dateStr, 'yyyy-MM', new Date())
  const firstDay = startOfMonth(baseDate)
  const lastDay = endOfMonth(baseDate)

  const commits = await prisma.gitLabCommit.findMany({
    where: {
      createdAt: {
        gte: firstDay,
        lte: lastDay,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Map back to the expected structure if needed, or update consumers
  const events = commits.map((c) => ({
    id: c.id,
    short_id: c.shortId,
    title: c.title,
    message: c.message,
    author_name: c.authorName,
    author_email: c.authorEmail,
    authored_date: c.authoredDate.toISOString(),
    committer_name: c.committerName,
    committer_email: c.committerEmail,
    committed_date: c.committedDate.toISOString(),
    web_url: c.webUrl,
    project_name: c.projectName,
    project_path: c.projectPath,
    project_id: c.projectId,
    branch_name: c.branchName,
    branch_names: c.branchNames ? JSON.parse(c.branchNames) : [],
    action_name: c.actionName,
    created_at: c.createdAt.toISOString(),
  }))

  return { success: true, events, date: dateStr, cached: true }
}
