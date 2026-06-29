import { fetch } from '@tauri-apps/plugin-http'
import type { GitLabEvent } from '~/types/gitlab'
import { getSetting } from '~/queries/settings'
import { getGitLabCommitsByPeriod, upsertGitLabCommit } from '~/queries/gitlab'

export interface GitLabConfig {
  token: string
  url: string
}

interface RawGitLabUser {
  id: number
  username: string
  email: string
  name: string
}

interface RawGitLabProject {
  id: number
  name: string
  path_with_namespace: string
  default_branch?: string
}

interface RawGitLabCommit {
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

interface RawGitLabRef {
  name: string
  type: string
}

export async function getGitLabConfig(): Promise<GitLabConfig> {
  const token = await getSetting('gitlab_token')
  const url = await getSetting('gitlab_url')

  return {
    token: token || '',
    url: url || 'https://gitlab-ce.brilife.co.id',
  }
}

export async function fetchGitLab<T = unknown>(
  path: string,
  query: Record<string, string | number | boolean> = {},
): Promise<T> {
  const config = await getGitLabConfig()
  if (!config.token) {
    throw new Error('GitLab Token is missing in configuration')
  }

  const url = new URL(`${config.url}/api/v4/${path.replace(/^\//, '')}`)
  Object.entries(query).forEach(([key, value]) => url.searchParams.append(key, String(value)))

  const response = await fetch(url.toString(), {
    headers: { 'PRIVATE-TOKEN': config.token },
  })

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`)
  }

  return (await response.json()) as T
}

export async function getGitLabUser(): Promise<RawGitLabUser> {
  return await fetchGitLab<RawGitLabUser>('user')
}

export async function getGitLabProjects(): Promise<RawGitLabProject[]> {
  return await fetchGitLab<RawGitLabProject[]>('projects', {
    membership: true,
    simple: true,
    per_page: 100,
    order_by: 'last_activity_at',
  })
}

export async function getProjectDetails(projectId: number): Promise<RawGitLabProject> {
  return await fetchGitLab<RawGitLabProject>(`projects/${projectId}`)
}

export async function getProjectCommits(
  projectId: number,
  query: { since?: string; until?: string; per_page?: number },
): Promise<RawGitLabCommit[]> {
  return await fetchGitLab<RawGitLabCommit[]>(
    `projects/${projectId}/repository/commits`,
    query as Record<string, string | number | boolean>,
  )
}

export async function getCommitRefs(projectId: number, sha: string): Promise<RawGitLabRef[]> {
  return await fetchGitLab<RawGitLabRef[]>(`projects/${projectId}/repository/commits/${sha}/refs`, {
    type: 'branch',
  })
}

export async function syncGitLabEvents(dateStr: string, force: boolean = false) {
  const { getMonthRange } = await import('./dates')
  const { firstDayStr: firstDay, lastDayStr: lastDay } = getMonthRange(dateStr)

  const projectsSetting = await getSetting('gitlab_selected_projects')
  const selectedProjectIds = projectsSetting ? projectsSetting.split(',').map(Number) : []

  const user = await getGitLabUser()
  const userEmail = user.email

  if (!force) {
    const existingCommits = await getGitLabCache(dateStr)
    if (existingCommits.events.length > 0) {
      return { ...existingCommits, cached: true }
    }
  }

  if (selectedProjectIds.length === 0) {
    return { success: true, events: [], date: dateStr, note: 'Please select projects in settings.' }
  }

  const commitPromises = selectedProjectIds.map(async (projectId: number) => {
    try {
      const project = await getProjectDetails(projectId)
      const commits = await getProjectCommits(projectId, {
        since: `${firstDay}T00:00:00+07:00`,
        until: `${lastDay}T23:59:59+07:00`,
        per_page: 100,
      })

      const authoredCommits = (commits || []).filter((c) => c.author_email === userEmail)

      const enrichedCommits = await Promise.all(
        authoredCommits.map(async (c) => {
          let branchNames: string[] = []
          try {
            const refs = await getCommitRefs(projectId, c.id)
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
  for (const commit of allCommits) {
    await upsertGitLabCommit(commit)
  }

  return { success: true, events: allCommits, date: dateStr }
}

export async function getGitLabCache(dateStr: string) {
  const { getMonthRange } = await import('./dates')
  const { firstDay, lastDay } = getMonthRange(dateStr)

  const commits = await getGitLabCommitsByPeriod(firstDay, lastDay)

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

export function formatGitLabActivity(ev: GitLabEvent): string {
  const action = ev.action_name?.toLowerCase() || ''
  const target = ev.target_type?.toLowerCase() || ''
  const project = ev.project_name || ev.target_title || 'Project'

  if (action === 'pushed_commit') {
    const projectLabel = ev.project_path || project
    const branchLabel = ev.branch_name ? ` (${ev.branch_name})` : ''
    return `[${projectLabel}]${branchLabel} ${ev.title}`
  } else if (action.includes('pushed') && ev.push_data) {
    const branch = ev.push_data.ref.replace('refs/heads/', '')
    return `Pushed to ${project} (${branch})`
  } else if (action === 'opened' && target.includes('mergerequest')) {
    return `Opened MR: ${ev.target_title}`
  } else if (action === 'merged' && target.includes('mergerequest')) {
    return `Merged MR: ${ev.target_title}`
  } else if (action === 'accepted' && target.includes('mergerequest')) {
    return `Accepted MR: ${ev.target_title}`
  } else if (action === 'commented on') {
    return `Commented on ${target}: ${ev.target_title || project}`
  }
  return `${ev.action_name} ${ev.target_type || ''} on ${project}`.trim()
}
