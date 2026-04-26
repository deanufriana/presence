import { format } from 'date-fns'

export default defineEventHandler(async (event): Promise<any> => {
  const query = getQuery(event)
  const dateStr = query.date as string || new Date().toISOString().slice(0, 7)

  try {
    const [gitlabRes, calendarCache, reports]: any = await Promise.all([
      getGitLabCache(dateStr),
      getCalendarCache(dateStr),
      getDailyReports(dateStr)
    ])

    // 1. Group GitLab Commits by Date
    const groupedActivities: Record<string, string[]> = {}

    if (gitlabRes.success && gitlabRes.events) {
      gitlabRes.events.forEach((ev: any) => {
        const date = format(new Date(ev.created_at), 'yyyy-MM-dd')
        if (!groupedActivities[date]) groupedActivities[date] = []

        let desc = ev.title || ''

        if (desc && !groupedActivities[date].includes(desc)) {
          groupedActivities[date].push(desc)
        }
      })
    }

    // 1.1 Group Calendar Events by Date
    if (calendarCache && calendarCache.events) {
      calendarCache.events.forEach((ev: any) => {
        const date = ev.date
        if (!groupedActivities[date]) groupedActivities[date] = []

        let act = ev.summary
        if (ev.startTime && ev.endTime) {
          act = `Meeting from ${ev.startTime} to ${ev.endTime} with discuss about ${ev.summary}`
        } else if (ev.startTime) {
          act = `Meeting at ${ev.startTime} with discuss about ${ev.summary}`
        }

        if (act && !groupedActivities[date].includes(act)) {
          groupedActivities[date].push(act)
        }
      })
    }

    // 2. Add Manual Activities
    if (reports && Array.isArray(reports)) {
      reports.forEach((ma: any) => {
        if (!groupedActivities[ma.date]) groupedActivities[ma.date] = []
        const current = groupedActivities[ma.date]!
        if (!current.includes(ma.aktivitas)) {
          current.push(ma.aktivitas)
        }
      })
    }

    // 3. Build the Rows and Save to DB
    const activeDates = Object.keys(groupedActivities).sort()
    const rows = await Promise.all(activeDates.map(async (date) => {
      return await upsertDailyReport({
        date,
        activities: groupedActivities[date]!
      })
    }))

    return {
      success: true,
      rows,
      raw: { gitlab: gitlabRes }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})
