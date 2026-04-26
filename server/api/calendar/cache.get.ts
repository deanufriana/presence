export default defineEventHandler(async (event): Promise<any> => {
  const query = getQuery(event)
  const dateStr = query.date as string || new Date().toISOString().slice(0, 7)

  try {
    const res = await getCalendarCache(dateStr)
    return { success: true, ...res, date: dateStr, cached: res.events.length > 0 }
  } catch (error: any) {
    return { success: false, error: error.message, events: [] }
  }
})
