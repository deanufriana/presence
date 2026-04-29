export default defineEventHandler(async () => {
  try {
    const latest = await prisma.summaryLog.findFirst({
      orderBy: { period: 'desc' },
    })

    return { success: true, summary: latest }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('API Error (summary-log.latest):', error)
    return { success: false, error: msg || 'Internal server error' }
  }
})
