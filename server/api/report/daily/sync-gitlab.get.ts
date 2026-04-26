import { format } from 'date-fns'

export default defineEventHandler(async (event): Promise<any> => {
  const query = getQuery(event)
  const dateStr = query.date as string || new Date().toISOString().slice(0, 7)
  const force = query.force === 'true'

  try {
    const [gitlabRes, reports]: any = await Promise.all([
      syncGitLabEvents(dateStr, force),
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

    // 3. Build the Rows
    const activeDates = Object.keys(groupedActivities).sort()
    const rows = activeDates.map(date => ({
      date,
      masuk: getRandomTime(7, 8),
      pulang: getRandomTime(17, 18),
      ti: 'TI',
      aktivitas: groupedActivities[date]!.join('; ')
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
