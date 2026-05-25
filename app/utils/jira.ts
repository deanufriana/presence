import { fetch } from '@tauri-apps/plugin-http'
import type { JiraEvent, MonthlyReportRow, SettingsData } from '~/types/report'
import { getSetting } from '~/queries/settings'
import { getJiraActivitiesByPeriod, upsertJiraActivity } from '~/queries/jira'

export interface JiraConfig {
  baseUrl: string
  email: string
  token: string
}

export class JiraApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly statusText: string,
  ) {
    super(message)
    this.name = 'JiraApiError'
  }
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

export interface JiraProject {
  id: string
  key: string
  name: string
}

export interface JiraIssueType {
  id: string
  name: string
  description: string
  subtask: boolean
}

export async function fetchJira<T = unknown>(
  path: string,
  config: JiraConfig,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    query?: Record<string, string | number | boolean>
    body?: unknown
  } = {},
): Promise<T> {
  if (!config.baseUrl || !config.email || !config.token) {
    throw new Error('Jira configuration incomplete')
  }

  const method = options.method || 'GET'
  const query = options.query || {}

  const url = new URL(`${config.baseUrl}/rest/api/3/${path.replace(/^\//, '')}`)
  Object.entries(query).forEach(([key, value]) => url.searchParams.append(key, String(value)))

  const auth = btoa(`${config.email}:${config.token}`)
  const headers: Record<string, string> = {
    Authorization: `Basic ${auth}`,
    Accept: 'application/json',
  }

  if (options.body) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    throw new JiraApiError(
      `Jira API error (${response.status})`,
      response.status,
      response.statusText,
    )
  }

  return (await response.json()) as T
}

export async function getJiraProjects(config: JiraConfig): Promise<JiraProject[]> {
  return await fetchJira<JiraProject[]>('project', config)
}

export async function getJiraIssueTypes(config: JiraConfig): Promise<JiraIssueType[]> {
  return await fetchJira<JiraIssueType[]>('issuetype', config)
}

export interface JiraMyself {
  accountId: string
  displayName: string
}

export async function getJiraMyself(config: JiraConfig): Promise<JiraMyself> {
  return await fetchJira<JiraMyself>('myself', config)
}

export async function createJiraIssue(
  config: JiraConfig,
  issueData: {
    fields: {
      project: { key: string }
      summary: string
      issuetype: { id: string }
      parent?: { key: string }
      description?: unknown
      assignee?: { id: string }
    }
  },
): Promise<{ id: string; key: string; self: string }> {
  return await fetchJira<{ id: string; key: string; self: string }>('issue', config, {
    method: 'POST',
    body: issueData,
  })
}

export async function buildAdfRowDescription(
  row: MonthlyReportRow,
  settings: SettingsData,
  selectedDateStr: string,
  userDescription?: string,
): Promise<Record<string, unknown>> {
  const { parse, format } = await import('date-fns')
  const { id: idLocale } = await import('date-fns/locale')

  let monthName = ''
  let yearName = ''
  try {
    const parsedDate = parse(selectedDateStr, 'yyyy-MM', new Date())
    monthName = format(parsedDate, 'MMMM', { locale: idLocale })
    yearName = format(parsedDate, 'yyyy')
  } catch {
    monthName = selectedDateStr
    yearName = ''
  }

  const userName = settings.user_name || '-'
  const userPosition = settings.user_position || '-'
  const userNopeg = settings.user_nopeg || '-'
  const divHeadName = settings.div_head_name || '-'
  const divHeadPosition = settings.div_head_position || '-'

  const descriptionNodes: Record<string, unknown>[] = userDescription
    ? [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: userDescription }],
        },
        { type: 'rule' },
      ]
    : []

  return {
    type: 'doc',
    version: 1,
    content: [
      ...descriptionNodes,
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'BAST Task Details' }],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Periode: ', marks: [{ type: 'strong' }] },
          { type: 'text', text: `${monthName} ${yearName}\n` },
          { type: 'text', text: 'Pekerja Project (Pihak Pertama): ', marks: [{ type: 'strong' }] },
          { type: 'text', text: `${userName} (${userPosition} / ${userNopeg})\n` },
          { type: 'text', text: 'Penerima (Pihak Kedua): ', marks: [{ type: 'strong' }] },
          { type: 'text', text: `${divHeadName} (${divHeadPosition})\n` },
        ],
      },
      {
        type: 'table',
        attrs: { isNumberColumnEnabled: false, layout: 'default' },
        content: [
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableHeader',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', text: 'Task/Aktivitas', marks: [{ type: 'strong' }] },
                    ],
                  },
                ],
              },
              {
                type: 'tableHeader',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Progress', marks: [{ type: 'strong' }] }],
                  },
                ],
              },
              {
                type: 'tableHeader',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Status', marks: [{ type: 'strong' }] }],
                  },
                ],
              },
              {
                type: 'tableHeader',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Keterangan', marks: [{ type: 'strong' }] }],
                  },
                ],
              },
            ],
          },
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableCell',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: row.project || '-' }],
                  },
                ],
              },
              {
                type: 'tableCell',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: row.progres || '100%' }],
                  },
                ],
              },
              {
                type: 'tableCell',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: row.done || 'Done' }],
                  },
                ],
              },
              {
                type: 'tableCell',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: row.status || '-' }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  }
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
    query: { jql, maxResults: 100, fields: 'summary,issuetype,status,project,updated' },
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
