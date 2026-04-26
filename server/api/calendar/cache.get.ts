export default defineEventHandler(async (event): Promise<any> => {
  const query = getQuery(event)
  const dateStr = query.date as string || new Date().toISOString().slice(0, 7)

  try {
    const cacheEntry = await prisma.calendarCache.findUnique({
      where: { date: dateStr }
    })

    if (cacheEntry) {
      return { success: true, events: JSON.parse(cacheEntry.data), date: dateStr, cached: true }
    }

    return { success: true, events: [], date: dateStr, cached: false }
  } catch (error: any) {
    return { success: false, error: error.message, events: [] }
  }
})
