import { fetch } from '@tauri-apps/plugin-http'
import type { JiraEvent } from '~/types/report'
import { getSetting } from '~/queries/settings'
import { getJiraActivitiesByPeriod, upsertJiraActivity } from '~/queries/jira'

export interface JiraConfig {
  baseUrl: string
  email: string
  token: string
}

export interface JiraIssue {
  id: string
  key: string
  fields: {
    summary: string
    issuetype: { name: string }
    status: { name: string }
    project: { name: string }
    updated: string
  }
}

export async function getJiraConfig(): Promise<JiraConfig> {
  const baseUrl = await getSetting('jira_url')
  const email = await getSetting('jira_email')
  const token = await getSetting('jira_token')

  return {
    baseUrl: baseUrl || '',
    email: email || '',
    token: token || '',
  }
}

export async function fetchJira<T = unknown>(
  path: string,
  config: JiraConfig,
  query: Record<string, string | number | boolean> = {},
): Promise<T> {
  if (!config.baseUrl || !config.email || !config.token) {
    throw new Error('Jira configuration incomplete')
  }

  const url = new URL(`${config.baseUrl}/rest/api/3/${path.replace(/^\//, '')}`)
  Object.entries(query).forEach(([key, value]) => url.searchParams.append(key, String(value)))
  // console.log(url, 'URL')
  const auth = btoa(`${config.email}:${config.token}`)
  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Jira API error: ${response.statusText}`)
  }

  return (await response.json()) as T
}

export async function syncJiraActivities(dateStr: string, force: boolean = false) {
  const { startOfMonth, endOfMonth, parse, format } = await import('date-fns')
  const baseDate = parse(dateStr, 'yyyy-MM', new Date())
  const firstDay = format(startOfMonth(baseDate), 'yyyy-MM-dd')
  const lastDay = format(endOfMonth(baseDate), 'yyyy-MM-dd')

  const config = await getJiraConfig()

  if (!force) {
    const existing = await getJiraCache(dateStr)
    if (existing.events.length > 0) return { ...existing, cached: true }
  }

  if (!config.baseUrl) return { success: true, events: [], date: dateStr }

  // JQL for updated issues by current user in the month
  const jql = `updated >= "${firstDay}" AND updated <= "${lastDay}" AND assignee = currentUser() ORDER BY updated DESC`
  const data = await fetchJira<{ issues: JiraIssue[] }>('search/jql', config, {
    jql,
    maxResults: 100,
    fields: 'summary,issuetype,status,project,updated',
  })
  const issues = data.issues || []
  const events: JiraEvent[] = issues.map((issue) => ({
    id: issue.id,
    key: issue.key,
    summary: issue.fields.summary,
    type: issue.fields.issuetype.name,
    status: issue.fields.status.name,
    project_name: issue.fields.project.name,
    updated_at: issue.fields.updated,
    user_email: config.email,
    web_url: `${config.baseUrl}/browse/${issue.key}`,
  }))

  for (const event of events) {
    await upsertJiraActivity(event)
  }

  return { success: true, events, date: dateStr }
}

export async function getJiraCache(dateStr: string) {
  const { startOfMonth, endOfMonth, parse } = await import('date-fns')
  const baseDate = parse(dateStr, 'yyyy-MM', new Date())
  const firstDay = startOfMonth(baseDate)
  const lastDay = endOfMonth(baseDate)

  const activities = await getJiraActivitiesByPeriod(firstDay, lastDay)

  const events: JiraEvent[] = activities.map((a) => ({
    id: a.id,
    key: a.key,
    summary: a.summary,
    type: a.type,
    status: a.status,
    project_name: a.projectName,
    updated_at: a.updatedAt.toISOString(),
    user_email: a.userEmail,
    web_url: a.webUrl,
  }))

  return { success: true, events, date: dateStr, cached: true }
}

export function formatJiraActivity(ev: JiraEvent): string {
  const status = ev.status || 'Update'
  return `[${ev.project_name}] ${status}: ${ev.summary}`
}
