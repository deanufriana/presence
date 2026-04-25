export default defineEventHandler(async (event): Promise<any> => {
  const query = getQuery(event)
  const dateStr = query.date as string || new Date().toISOString().slice(0, 7)

  const [gitlabRes, msRes, manualRes]: any = await Promise.all([
    $fetch('/api/gitlab', { query: { date: dateStr, force: query.force } }),
    $fetch('/api/microsoft', { query: { date: dateStr } }),
    $fetch('/api/daily-report', { query: { date: dateStr } })
  ])

  // Helper to generate random time
  const getRandomTime = (startHour: number, endHour: number) => {
    const hour = Math.floor(Math.random() * (endHour - startHour)) + startHour
    const minute = Math.floor(Math.random() * 60)
    const second = Math.floor(Math.random() * 60)
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
  }

  // 1. Group GitLab Commits by Date
  const groupedActivities: Record<string, string[]> = {}

  if (gitlabRes.success && gitlabRes.events) {
    gitlabRes.events.forEach((ev: any) => {
      const date = new Date(ev.created_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
      if (!groupedActivities[date]) groupedActivities[date] = []

      const action = ev.action_name?.toLowerCase() || ''
      let desc = ev.title || ''

      if (desc && !groupedActivities[date].includes(desc)) {
        groupedActivities[date].push(desc)
      }
    })
  }

  // 2. Add Manual Activities
  if (manualRes.success && manualRes.activities) {
    manualRes.activities.forEach((ma: any) => {
      if (!groupedActivities[ma.date]) groupedActivities[ma.date] = []
      if (!groupedActivities[ma.date].includes(ma.activity)) {
        groupedActivities[ma.date].push(ma.activity)
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
    aktivitas: groupedActivities[date].join('; ')
  }))

  return {
    success: true,
    rows,
    raw: { gitlab: gitlabRes, microsoft: msRes }
  }
})
