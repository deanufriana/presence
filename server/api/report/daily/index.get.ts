export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  try {
    const datePrefix = query.date as string // e.g., "2024-04"
    const reports = await getDailyReports(datePrefix)
    return { success: true, reports }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('API Error (daily-report.get):', error)
    return { success: false, error: msg || 'Internal server error' }
  }
})
