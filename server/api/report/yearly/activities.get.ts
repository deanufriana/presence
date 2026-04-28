import { format } from 'date-fns'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const year = query.year as string

  if (!year) {
    return { success: false, error: 'Year is required' }
  }

  const startDate = new Date(`${year}-01-01T00:00:00Z`)
  const endDate = new Date(`${year}-12-31T23:59:59Z`)

  try {
    // We want to know for each month if there's any activity
    // Use select to minimize data transfer
    const [gitlabDates, jiraDates, calendarEvents, dailyReports] = await Promise.all([
      prisma.gitLabCommit.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        select: { createdAt: true }
      }),
      prisma.jiraActivity.findMany({
        where: { updatedAt: { gte: startDate, lte: endDate } },
        select: { updatedAt: true }
      }),
      prisma.calendarEvent.findMany({
        where: { date: { startsWith: year } },
        select: { date: true }
      }),
      prisma.dailyReport.findMany({
        where: { date: { startsWith: year } },
        select: { date: true }
      })
    ])

    const months = Array.from({ length: 12 }, (_, i) => {
      const monthNum = (i + 1).toString().padStart(2, '0')
      const monthStr = `${year}-${monthNum}`

      const hasGitlab = gitlabDates.some(c => format(new Date(c.createdAt), 'yyyy-MM') === monthStr)
      const hasJira = jiraDates.some(c => format(new Date(c.updatedAt), 'yyyy-MM') === monthStr)
      const hasCalendar = calendarEvents.some(e => e.date.startsWith(monthStr))
      const hasDaily = dailyReports.some(r => r.date.startsWith(monthStr))

      return {
        month: monthStr,
        hasGitlab,
        hasJira,
        hasCalendar,
        hasDaily,
        hasActivity: hasGitlab || hasJira || hasCalendar || hasDaily
      }
    })

    return {
      success: true,
      months
    }
  } catch (error: any) {
    console.error('Yearly activities error:', error)
    return { success: false, error: error.message }
  }
})
