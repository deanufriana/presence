export default defineEventHandler(async (event): Promise<any> => {
  try {
    const body = await readBody(event)
    const date = body?.date
    if (!date) return { success: false, error: 'Date required' }

    await prisma.dailyReport.delete({
      where: { date }
    })

    return { success: true }
  } catch (error: any) {
    console.error('API Error (daily-report.delete):', error)
    return { success: false, error: error.message || 'Internal server error' }
  }
})
