export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const dateStr = (query.date as string) || new Date().toISOString().slice(0, 7)

  try {
    const res = await getCalendarCache(dateStr)
    return { success: true, ...res, date: dateStr, cached: res.events.length > 0 }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return { success: false, error: msg, events: [] }
  }
})
