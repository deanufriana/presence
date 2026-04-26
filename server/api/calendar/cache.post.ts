export default defineEventHandler(async (event): Promise<any> => {
  try {
    const body = await readBody(event)
    const { date, events } = body

    if (!date) return { success: false, error: 'Date required' }

    // Clear existing events for this month to avoid duplicates
    await prisma.calendarEvent.deleteMany({
      where: {
        date: {
          startsWith: date
        }
      }
    })

    // Bulk insert new events
    if (events && Array.isArray(events)) {
      await prisma.calendarEvent.createMany({
        data: events.map((ev: any) => ({
          date: ev.date,
          summary: ev.summary,
          startTime: ev.startTime,
          endTime: ev.endTime
        }))
      })
    }

    return { success: true }
  } catch (error: any) {
    console.error('API Error (calendar-cache.post):', error)
    return { success: false, error: error.message }
  }
})
