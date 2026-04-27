import { format } from 'date-fns'

export default defineEventHandler(async (event): Promise<any> => {
  const query = getQuery(event)
  const dateStr = query.date as string || format(new Date(), 'yyyy-MM')

  try {
    const groupedActivities = await fetchAndGroupActivities(dateStr, true)
    const activeDates = Object.keys(groupedActivities).sort()
    const rows = await Promise.all(activeDates.map(async (date) => {
      return await upsertDailyReport({
        date,
        activities: groupedActivities[date]!
      })
    }))

    return {
      success: true,
      rows
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})
