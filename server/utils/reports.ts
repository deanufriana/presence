import { prisma } from './prisma'

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
    where: { month },
    orderBy: { createdAt: 'asc' }
  })

  const summaryLog = await prisma.summaryLog.findFirst({
    where: { month },
    orderBy: { createdAt: 'desc' }
  })

  return {
    month,
    rows: rows.map(r => ({
      ...r,
      bulan: r.month // Map month to bulan for frontend compatibility
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

    // Detect bullet item: - Description [Status: XXX]
    const bulletMatch = trimmed.match(/^-\s+(.+?)(?:\.\s*)?\[Status:\s*(.+?)\]\s*\.?$/)
    if (bulletMatch && currentProject && bulletMatch[1] && bulletMatch[2]) {
      const description = bulletMatch[1].trim()
      const status = bulletMatch[2].trim()

      rows.push({
        project: `[${currentProject}] ${description}`,
        progres: '100%',
        done: 'Done',
        status
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
      data: { month, summary: summary || '' }
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
          month,
          project: row.project,
          progres: row.progres,
          done: row.done,
          status: row.status
        }))
      })
    }
  }

  return await getMonthlyReport(month)
}
