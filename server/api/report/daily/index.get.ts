

export default defineEventHandler(async (event): Promise<any> => {
  const query = getQuery(event)

  try {
    const datePrefix = query.date as string // e.g., "2024-04"
    const reports = await getDailyReports(datePrefix)
    return { success: true, reports }
  } catch (error: any) {
    console.error('API Error (daily-report.get):', error)
    return { success: false, error: error.message || 'Internal server error' }
  }
})
