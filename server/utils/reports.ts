import type { YearlyReportRow } from '~/types/report'
import { prisma } from './prisma'
import { format, parse } from 'date-fns'

export function formatGitLabActivity (ev: any): string {
  const desc = ev.title || ''
  const projectName = ev.project_name || 'Unknown Project'
  const branchName = ev.branch_name ? ` (branch: ${ev.branch_name})` : ''
  return `[Project: ${projectName}] ${desc}${branchName}`
}

export function formatCalendarActivity (ev: any): string {
  let act = ev.summary
  if (ev.startTime && ev.endTime) {
    act = `Meeting from ${ev.startTime} to ${ev.endTime} with discuss about ${ev.summary}`
  } else if (ev.startTime) {
    act = `Meeting at ${ev.startTime} with discuss about ${ev.summary}`
  }
  return act
}

export function formatJiraActivity (ev: any): string {
  const key = ev.key || ''
  const summary = ev.summary || ''
  const projectName = ev.project_name || 'Unknown Project'
  const type = ev.type || 'Issue'
  return `[Jira: ${projectName}] ${type} ${key}: ${summary}`
}

export async function fetchAndGroupActivities (dateStr: string, isMonth: boolean = false) {
  const monthStr = isMonth ? dateStr : dateStr.slice(0, 7)
  const [gitlabRes, calendarCache, jiraRes]: any = await Promise.all([
    getGitLabCache(monthStr),
    getCalendarCache(monthStr),
    getJiraCache(monthStr)
  ])

  const grouped: Record<string, string[]> = {}

  // 1. Process GitLab
  if (gitlabRes.success && gitlabRes.events) {
    gitlabRes.events.forEach((ev: any) => {
      const evDate = format(new Date(ev.created_at), 'yyyy-MM-dd')
      if (isMonth || evDate === dateStr) {
        if (!grouped[evDate]) grouped[evDate] = []
        const desc = formatGitLabActivity(ev)
        if (desc && !grouped[evDate].includes(desc)) grouped[evDate].push(desc)
      }
    })
  }

  // 2. Process Calendar
  if (calendarCache && calendarCache.events) {
    calendarCache.events.forEach((ev: any) => {
      const evDate = ev.date
      if (isMonth || evDate === dateStr) {
        if (!grouped[evDate]) grouped[evDate] = []
        const act = formatCalendarActivity(ev)
        if (act && !grouped[evDate].includes(act)) grouped[evDate].push(act)
      }
    })
  }

  // 3. Process Jira
  if (jiraRes.success && jiraRes.events) {
    jiraRes.events.forEach((ev: any) => {
      const evDate = ev.updated_at.split('T')[0]
      if (isMonth || evDate === dateStr) {
        if (!grouped[evDate]) grouped[evDate] = []
        const desc = formatJiraActivity(ev)
        if (desc && !grouped[evDate].includes(desc)) grouped[evDate].push(desc)
      }
    })
  }

  return grouped
}

export async function getDailyReports (datePrefix: string) {
  if (!datePrefix) throw new Error('Date prefix required')

  const reports = await prisma.dailyReport.findMany({
    where: {
      date: {
        startsWith: datePrefix
      }
    },
    orderBy: { date: 'asc' }
  })

  return reports
}

export async function getMonthlyReport (month: string) {
  if (!month) throw new Error('Month required')

  const rows = await prisma.monthlyReport.findMany({
    where: { month: month },
    orderBy: { createdAt: 'asc' }
  })

  const summaryLog = await prisma.summaryLog.findFirst({
    where: { period: month },
    orderBy: { createdAt: 'desc' }
  })

  return {
    month: month,
    rows: rows.map(r => ({
      ...r,
      month: r.month,
      sources: r.sources ? JSON.parse(r.sources) : []
    })) || [],
    summary: summaryLog?.summary || ''
  }
}

export async function getCalendarCache (month: string) {
  if (!month) throw new Error('Month required')

  const events = await prisma.calendarEvent.findMany({
    where: {
      date: {
        startsWith: month
      }
    },
    orderBy: { date: 'asc' }
  })

  return {
    events: events || []
  }
}

export async function upsertDailyReport (data: {
  date: string,
  activities: string[]
}) {
  const result = {
    date: data.date,
    masuk: getRandomTime('07:30', '08:00'),
    pulang: getRandomTime('17:00', '17:30'),
    ti: 'TI',
    aktivitas: data.activities.map(a => a.trim().startsWith('-') ? a.trim() : `- ${a.trim()}`).join('\n')
  }

  return await prisma.dailyReport.upsert({
    where: { date: result.date },
    update: {
      masuk: result.masuk,
      pulang: result.pulang,
      ti: result.ti,
      aktivitas: result.aktivitas
    },
    create: {
      date: result.date,
      masuk: result.masuk,
      pulang: result.pulang,
      ti: result.ti,
      aktivitas: result.aktivitas
    }
  })
}

/**
 * Parse AI markdown output into MonthlyReportRow-compatible objects.
 * Expected format:
 *   **Project Name**
 *   - Activity description. [Status: Project]
 *   - Another activity. [Status: Project Enhance]
 */
export function parseMonthlyMarkdown (markdown: string) {
  const lines = markdown.split('\n')
  const rows: { project: string, progres: string, done: string, status: string }[] = []
  let currentProject = ''

  for (const line of lines) {
    const trimmed = line.trim()

    // Detect project heading: **Project Name**
    const projectMatch = trimmed.match(/^\*\*(.+?)\*\*$/)
    if (projectMatch && projectMatch[1]) {
      currentProject = projectMatch[1].trim()
      continue
    }

    // Detect bullet item: - [Sources] Description [Status: XXX]
    const bulletMatch = trimmed.match(/^-\s+\[(.+?)\]\s+(.+?)(?:\.\s*)?\[Status:\s*(.+?)\]\s*\.?$/)
    if (bulletMatch && currentProject && bulletMatch[1] && bulletMatch[2] && bulletMatch[3]) {
      const sourceStr = bulletMatch[1].trim()
      const description = bulletMatch[2].trim()
      const status = bulletMatch[3].trim()

      const sources = sourceStr.split(',').map(s => s.trim())

      rows.push({
        project: `[${currentProject}] ${description}`,
        progres: '100%',
        done: 'Done',
        status,
        sources
      } as any)
    }
  }

  return rows
}

export function parseYearlyMarkdown (markdown: string) {
  const lines = markdown.split('\n')
  const rows: YearlyReportRow[] = []
  let currentProject = ''

  for (const line of lines) {
    const trimmed = line.trim()

    // Detect project heading: **Project Name** or ### **Project Name**
    const projectMatch = trimmed.match(/^(?:#{1,6}\s+)?\*\*(.+?)\*\*[:\s]*$/)
    if (projectMatch && projectMatch[1]) {
      currentProject = projectMatch[1].trim()
      continue
    }

    // Detect bullet item: - [dd/mm/yyyy] [Months] Description [Status: XXX]
    // Allowing flexible spacing between blocks
    const bulletMatch = trimmed.match(/^[-*]\s*\[(\d{2}\/\d{2}\/\d{4})\]\s*\[(.+?)\]\s*(.+?)(?:\.\s*)?\[Status:\s*(.+?)\]\s*\.?$/i)
    if (bulletMatch && currentProject && bulletMatch[1] && bulletMatch[2] && bulletMatch[3] && bulletMatch[4]) {
      const tanggal = bulletMatch[1].trim()
      const monthStr = bulletMatch[2].trim()
      const description = bulletMatch[3].trim()
      const statusLabel = bulletMatch[4].trim()

      rows.push({
        tanggal,
        month: monthStr,
        task: `[${currentProject}] ${description}`,
        deliverable: 'Deliver',
        status: 'Done',
        keterangan: statusLabel
      })
    }
  }

  return rows
}


export async function upsertMonthlyReport (data: {
  month: string,
  summary?: string,
  rows?: any[]
}) {
  const { month, summary, rows } = data

  // 1. Save summary to SummaryLog (Create new entry for history)
  if (summary !== undefined) {
    await prisma.summaryLog.create({
      data: { period: month, summary: summary || '' }
    })
  }

  // 2. Save rows to MonthlyReport
  if (Array.isArray(rows)) {
    // Delete existing rows for this month to sync
    await prisma.monthlyReport.deleteMany({
      where: { month }
    })

    if (rows.length > 0) {
      await prisma.monthlyReport.createMany({
        data: rows.map((row: any) => ({
          month: month,
          project: row.project,
          progres: row.progres,
          done: row.done,
          status: row.status,
          sources: row.sources ? JSON.stringify(row.sources) : null
        }))
      })
    }
  }

  return await getMonthlyReport(month)
}

export async function getYearlyReport (year: string) {
  if (!year) throw new Error('Year required')

  // Try to fetch from YearlyReport table first
  const yearlyRows = await prisma.yearlyReport.findMany({
    where: { year }
  })

  let rows = yearlyRows.map(r => ({
    tanggal: r.tanggal || '',
    month: r.month || '',
    task: r.task || '',
    deliverable: r.deliverable || 'Deliver',
    status: r.status || 'Done',
    keterangan: r.keterangan || ''
  }))

  // Sort rows chronologically by tanggal (dd/MM/yyyy)
  rows.sort((a, b) => {
    try {
      const dateA = parse(a.tanggal, 'dd/MM/yyyy', new Date())
      const dateB = parse(b.tanggal, 'dd/MM/yyyy', new Date())
      return dateA.getTime() - dateB.getTime()
    } catch {
      return 0
    }
  })

  return {
    year,
    rows
  }
}

export async function upsertYearlyReport (data: {
  year: string,
  summary?: string,
  rows?: YearlyReportRow[]
}) {
  const { year, summary, rows } = data

  if (summary !== undefined) {
    await prisma.summaryLog.upsert({
      where: { id: (await prisma.summaryLog.findFirst({ where: { period: year } }))?.id || -1 },
      update: { summary: summary || '' },
      create: { period: year, summary: summary || '' }
    })
  }

  if (Array.isArray(rows)) {
    // Sort rows chronologically before insertion
    rows.sort((a, b) => {
      try {
        const dateA = parse(a.tanggal, 'dd/MM/yyyy', new Date())
        const dateB = parse(b.tanggal, 'dd/MM/yyyy', new Date())
        return dateA.getTime() - dateB.getTime()
      } catch {
        return 0
      }
    })

    // Sync YearlyReport table
    await prisma.yearlyReport.deleteMany({
      where: { year }
    })

    if (rows.length > 0) {
      await prisma.yearlyReport.createMany({
        data: rows.map(row => ({
          year,
          tanggal: row.tanggal,
          month: row.month,
          task: row.task,
          deliverable: row.deliverable,
          status: row.status,
          keterangan: row.keterangan
        }))
      })
    }
  }

  return await getYearlyReport(year)
}

export async function getAllMonthlySummaries (year: string) {
  if (!year) throw new Error('Year required')

  // Get all unique months for this year that have summaries
  const summaries = await prisma.summaryLog.findMany({
    where: {
      period: {
        startsWith: `${year}-`
      },
      summary: {
        not: ''
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const latestSummaries: Record<string, string> = {}
  for (const s of summaries) {
    if (!latestSummaries[s.period]) {
      latestSummaries[s.period] = s.summary || ''
    }
  }

  return Object.entries(latestSummaries).map(([p, summary]) => ({
    period: p,
    summary
  })).sort((a, b) => a.period.localeCompare(b.period))
}
