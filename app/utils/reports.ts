import {
  getDailyReports,
  getMonthlyReport,
  upsertDailyReport as dbUpsertDailyReport,
  getYearlyReport,
  upsertYearlyReport as dbUpsertYearlyReport,
  getMonthlyActivityStatus,
  getAllMonthlySummaries,
  upsertMonthlyReport as dbUpsertMonthlyReport,
} from '~/queries/reports'
import { getGitLabCache, formatGitLabActivity } from './gitlab'
import { getJiraCache, formatJiraActivity } from './jira'
import { getCalendarCache, formatCalendarActivity } from './calendar'
import type {
  MonthlyReportRow,
  YearlyReportRow,
  GitLabEvent,
  CalendarEvent,
  JiraEvent,
} from '~/types/report'

export { getDailyReports, getMonthlyReport, getYearlyReport, getAllMonthlySummaries }

export async function upsertDailyReport(data: { date: string; activities: string[] }) {
  const result = {
    masuk: getRandomTime('07:30', '08:00'),
    pulang: getRandomTime('17:00', '17:30'),
    ti: 'TI',
    aktivitas: data.activities
      .map((a) => (a.trim().startsWith('-') ? a.trim() : `- ${a.trim()}`))
      .join('\n'),
  }

  return await dbUpsertDailyReport(data.date, result)
}

export async function upsertMonthlyReport(data: {
  month: string
  summary?: string
  rows?: MonthlyReportRow[]
}) {
  return await dbUpsertMonthlyReport(data.month, data.summary, data.rows)
}

export async function upsertYearlyReport(data: {
  year: string
  summary?: string
  rows?: YearlyReportRow[]
}) {
  return await dbUpsertYearlyReport(data.year, data.summary, data.rows)
}

export async function fetchAndGroupActivities(dateStr: string, isMonth: boolean = false) {
  const monthStr = isMonth ? dateStr : dateStr.slice(0, 7)
  const [gitlabRes, calendarCache, jiraRes] = await Promise.all([
    getGitLabCache(monthStr),
    getCalendarCache(monthStr),
    getJiraCache(monthStr),
  ])

  const grouped: Record<string, string[]> = {}

  // GitLab
  gitlabRes.events.forEach((ev: GitLabEvent) => {
    const date = ev.created_at?.split('T')[0]
    if (date) {
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(formatGitLabActivity(ev))
    }
  })

  // Calendar
  calendarCache.events.forEach((ev: CalendarEvent) => {
    const date = ev.date
    if (date) {
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(formatCalendarActivity(ev))
    }
  })

  // Jira
  jiraRes.events.forEach((ev: JiraEvent) => {
    const date = ev.updated_at?.split('T')[0]
    if (date) {
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(formatJiraActivity(ev))
    }
  })

  // Deduplicate and filter
  for (const date in grouped) {
    grouped[date] = Array.from(new Set(grouped[date])).filter(Boolean)
  }

  return grouped
}

export async function getYearlyActivities(year: string) {
  const { gitlabDates, jiraDates, calendarEvents, dailyReports } =
    await getMonthlyActivityStatus(year)
  const { format } = await import('date-fns')

  const months = Array.from({ length: 12 }, (_, i) => {
    const monthNum = (i + 1).toString().padStart(2, '0')
    const monthStr = `${year}-${monthNum}`

    const hasGitlab = gitlabDates.some((c) => format(c.createdAt, 'yyyy-MM') === monthStr)
    const hasJira = jiraDates.some((c) => format(c.updatedAt, 'yyyy-MM') === monthStr)
    const hasCalendar = calendarEvents.some((e) => e.date.startsWith(monthStr))
    const hasDaily = dailyReports.some((r) => r.date.startsWith(monthStr))

    return {
      month: monthStr,
      hasGitlab,
      hasJira,
      hasCalendar,
      hasDaily,
      hasActivity: hasGitlab || hasJira || hasCalendar || hasDaily,
    }
  })

  return months
}

function getRandomTime(start: string, end: string) {
  const [sH, sM] = (start || '').split(':').map(Number)
  const [eH, eM] = (end || '').split(':').map(Number)
  const startMin = (sH || 0) * 60 + (sM || 0)
  const endMin = (eH || 0) * 60 + (eM || 0)
  const randMin = Math.floor(Math.random() * (endMin - startMin + 1)) + startMin
  const h = Math.floor(randMin / 60)
  const m = randMin % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export function parseMonthlyMarkdown(markdown: string) {
  const lines = markdown.split('\n')
  const rows: MonthlyReportRow[] = []
  let currentProject = ''

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const projectMatch = trimmed.match(/^\*\*([^*]+)\*\*$/)
    if (projectMatch && projectMatch[1]) {
      currentProject = projectMatch[1].trim()
      continue
    }

    const bulletMatch = trimmed.match(
      /^[-*]\s*\[([^\]]+)\]\s*(.+?)(?:\s*\[Status:\s*([^\]]+)\])?\.?$/i,
    )
    if (bulletMatch && bulletMatch[1] && bulletMatch[2]) {
      const sourceStr = bulletMatch[1].trim()
      const description = bulletMatch[2].trim()
      const status = bulletMatch[3]?.trim() || 'Project'
      const sources = sourceStr.split(',').map((s: string) => s.trim())

      rows.push({
        month: '',
        project: `[${currentProject}] ${description}`,
        progres: '100%',
        done: 'Done',
        status,
        sources,
      })
    }
  }

  return rows
}

export function parseYearlyMarkdown(markdown: string) {
  const lines = markdown.split('\n')
  const rows: YearlyReportRow[] = []
  let currentProject = ''

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const projectMatch = trimmed.match(/^\*\*([^*]+)\*\*$/)
    if (projectMatch && projectMatch[1]) {
      currentProject = projectMatch[1].trim()
      continue
    }

    const bulletMatch = trimmed.match(
      /^[-*]\s*\[(\d{2}\/\d{2}\/\d{4})\]\s*\[(.+?)\]\s*(.+?)(?:\s*\[Status:\s*(.+?)\])?\.?$/i,
    )
    if (bulletMatch && bulletMatch[1] && bulletMatch[2] && bulletMatch[3] && currentProject) {
      const tanggal = bulletMatch[1].trim()
      const monthStr = bulletMatch[2].trim()
      const description = bulletMatch[3].trim()
      const statusLabel = bulletMatch[4]?.trim() || 'Project'

      rows.push({
        tanggal,
        month: monthStr,
        task: `[${currentProject}] ${description}`,
        deliverable: 'Deliver',
        status: 'Done',
        keterangan: statusLabel,
      })
    }
  }

  return rows
}
