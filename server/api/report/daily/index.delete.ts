export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event).catch(() => ({}))
    const query = getQuery(event)
    const date = (body?.date || query?.date) as string

    if (!date) return { success: false, error: 'Date required' }

    await prisma.dailyReport.deleteMany({
      where: { date },
    })

    return { success: true }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('API Error (daily-report.delete):', error)
    return { success: false, error: msg || 'Internal server error' }
  }
})
