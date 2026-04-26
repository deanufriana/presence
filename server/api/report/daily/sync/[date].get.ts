import { format } from 'date-fns'

export default defineEventHandler(async (event): Promise<any> => {
  const dateStr = event.context.params?.date as string // Expecting yyyy-MM-dd
  if (!dateStr) {
    throw createError({ statusCode: 400, message: 'Date is required' })
  }

  const monthStr = dateStr.slice(0, 7) // YYYY-MM

  try {
    const [gitlabRes, calendarCache]: any = await Promise.all([
      getGitLabCache(monthStr),
      getCalendarCache(monthStr)
    ])

    const activities: string[] = []

    // 1. GitLab Commits for this specific day
    if (gitlabRes.success && gitlabRes.events) {
      gitlabRes.events.forEach((ev: any) => {
        const evDate = format(new Date(ev.created_at), 'yyyy-MM-dd')
        if (evDate === dateStr) {
          const desc = ev.title || ''
          if (desc && !activities.includes(desc)) {
            activities.push(desc)
          }
        }
      })
    }

    // 2. Calendar Events for this specific day
    if (calendarCache && calendarCache.events) {
      calendarCache.events.forEach((ev: any) => {
        if (ev.date === dateStr) {
          let act = ev.summary
          if (ev.startTime && ev.endTime) {
            act = `Meeting from ${ev.startTime} to ${ev.endTime} with discuss about ${ev.summary}`
          } else if (ev.startTime) {
            act = `Meeting at ${ev.startTime} with discuss about ${ev.summary}`
          }

          if (act && !activities.includes(act)) {
            activities.push(act)
          }
        }
      })
    }

    const report = await upsertDailyReport({
      date: dateStr,
      activities
    })

    return {
      success: true,
      data: report
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
})
