export default defineEventHandler(async (event): Promise<any> => {
  try {
    const body = await readBody(event)
    const { date, events } = body

    if (!date) return { success: false, error: 'Date required' }

    await prisma.calendarCache.upsert({
      where: { date },
      update: {
        data: JSON.stringify(events)
      },
      create: {
        date,
        data: JSON.stringify(events)
      }
    })

    return { success: true }
  } catch (error: any) {
    console.error('API Error (calendar-cache.post):', error)
    return { success: false, error: error.message }
  }
})
