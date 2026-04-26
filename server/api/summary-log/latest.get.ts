export default defineEventHandler(async (): Promise<any> => {
  try {
    const latest = await prisma.summaryLog.findFirst({
      orderBy: { month: 'desc' }
    })

    return { success: true, summary: latest }
  } catch (error: any) {
    console.error('API Error (summary-log.latest):', error)
    return { success: false, error: error.message || 'Internal server error' }
  }
})
