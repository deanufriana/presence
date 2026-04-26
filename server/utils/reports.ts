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

  const report = await prisma.monthlyReport.findUnique({
    where: { month }
  })

  if (!report) return null

  return {
    ...report,
    rows: report.rows ? JSON.parse(report.rows) : []
  }
}

export async function getCalendarCache (month: string) {
  if (!month) throw new Error('Month required')

  const cache = await prisma.calendarCache.findUnique({
    where: { date: month }
  })

  if (!cache) return null

  return {
    ...cache,
    events: cache.data ? JSON.parse(cache.data) : []
  }
}
