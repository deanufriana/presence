import { prisma } from './prisma'

export interface JiraConfig {
  token: string
  url: string
  email: string
}

export interface RawJiraIssue {
  id: string
  key: string
  fields: {
    summary: string
    updated: string
    issuetype?: { name: string }
    status?: { name: string }
    project?: { name: string }
  }
}

export interface JiraSearchResponse {
  issues: RawJiraIssue[]
}

export async function getJiraConfig(): Promise<JiraConfig> {
  const tokenSetting = await prisma.setting.findUnique({ where: { key: 'jira_token' } })
  const urlSetting = await prisma.setting.findUnique({ where: { key: 'jira_url' } })
  const emailSetting = await prisma.setting.findUnique({ where: { key: 'jira_email' } })

  return {
    token: tokenSetting?.value || '',
    url: urlSetting?.value || '',
    email: emailSetting?.value || '',
  }
}

export async function fetchJira<T = unknown>(
  path: string,
  config: JiraConfig,
  query: Record<string, string | number | boolean> = {},
): Promise<T> {
  if (!config.token || !config.url || !config.email) {
    throw new Error('Jira configuration incomplete')
  }

  const url = `${config.url.replace(/\/$/, '')}/rest/api/3/${path.replace(/^\//, '')}`
  const auth = Buffer.from(`${config.email}:${config.token}`).toString('base64')

  return await $fetch<T>(url, {
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
    },
    query,
  })
}

export async function syncJiraActivities(dateStr: string, force: boolean = false) {
  const { startOfMonth, endOfMonth, parse, format } = await import('date-fns')
  const baseDate = parse(dateStr, 'yyyy-MM', new Date())
  const firstDay = format(startOfMonth(baseDate), 'yyyy-MM-dd')
  const lastDay = format(endOfMonth(baseDate), 'yyyy-MM-dd')

  const config = await getJiraConfig()
  if (!config.token || !config.url || !config.email) {
    return { success: false, message: 'Jira configuration incomplete' }
  }

  // 1. Try to load from Cache first
  if (!force) {
    const existing = await getJiraCache(dateStr)
    if (existing.events.length > 0) {
      return { ...existing, cached: true }
    }
  }

  // 2. Fetch issues from Jira
  // JQL: updated >= "start" AND updated <= "end" AND (assignee = currentUser() OR reporter = currentUser() OR creator = currentUser())
  const jql = `updated >= "${firstDay}" AND updated <= "${lastDay}" AND (assignee = currentUser() OR reporter = currentUser() OR creator = currentUser())`

  try {
    const response = await fetchJira<JiraSearchResponse>('search/jql/', config, {
      jql,
      maxResults: 100,
      fields: 'summary,status,updated,issuetype,project',
    })

    const issues = response.issues || []

    // Save to database
    await Promise.all(
      issues.map(async (issue) => {
        const webUrl = `${config.url.replace(/\/$/, '')}/browse/${issue.key}`
        await prisma.jiraActivity.upsert({
          where: { id: issue.id },
          update: {
            key: issue.key,
            summary: issue.fields.summary,
            type: issue.fields.issuetype?.name || 'Issue',
            status: issue.fields.status?.name,
            projectName: issue.fields.project?.name,
            updatedAt: new Date(issue.fields.updated),
            userEmail: config.email,
            webUrl,
          },
          create: {
            id: issue.id,
            key: issue.key,
            summary: issue.fields.summary,
            type: issue.fields.issuetype?.name || 'Issue',
            status: issue.fields.status?.name,
            projectName: issue.fields.project?.name,
            updatedAt: new Date(issue.fields.updated),
            userEmail: config.email,
            webUrl,
          },
        })
      }),
    )

    const mappedEvents = issues.map((issue) => ({
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      type: issue.fields.issuetype?.name || 'Issue',
      status: issue.fields.status?.name,
      project_name: issue.fields.project?.name,
      updated_at: issue.fields.updated,
      web_url: `${config.url.replace(/\/$/, '')}/browse/${issue.key}`,
    }))

    return { success: true, events: mappedEvents, date: dateStr }
  } catch (err: unknown) {
    const error = err as { message: string }
    console.error('Jira sync error:', error)
    return { success: false, message: error.message }
  }
}

export async function getJiraCache(dateStr: string) {
  const { startOfMonth, endOfMonth, parse } = await import('date-fns')
  const baseDate = parse(dateStr, 'yyyy-MM', new Date())
  const firstDay = startOfMonth(baseDate)
  const lastDay = endOfMonth(baseDate)

  const config = await getJiraConfig()

  const activities = await prisma.jiraActivity.findMany({
    where: {
      userEmail: config.email,
      updatedAt: {
        gte: firstDay,
        lte: lastDay,
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  // Map to expected structure
  const events = activities.map((a) => ({
    id: a.id,
    key: a.key,
    summary: a.summary,
    type: a.type,
    status: a.status,
    project_name: a.projectName,
    updated_at: a.updatedAt.toISOString(),
    web_url: a.webUrl,
  }))

  return { success: true, events, date: dateStr }
}
