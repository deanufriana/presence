import type { CalendarEvent } from '~/types/calendar'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { date, events } = body

    if (!date) return { success: false, error: 'Date required' }

    // Clear existing events for this month to avoid duplicates
    await prisma.calendarEvent.deleteMany({
      where: {
        date: {
          startsWith: date,
        },
      },
    })

    // Bulk insert new events
    if (events && Array.isArray(events)) {
      await prisma.calendarEvent.createMany({
        data: events.map((ev: CalendarEvent) => ({
          date: ev.date,
          summary: ev.summary || '',
          startTime: ev.startTime,
          endTime: ev.endTime,
        })),
      })
    }

    return { success: true }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('API Error (calendar-cache.post):', error)
    return { success: false, error: msg }
  }
})
