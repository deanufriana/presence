export default defineEventHandler(async (event): Promise<any> => {
  const query = getQuery(event)

  try {
    const month = query.month as string // e.g., "2024-04"
    const report = await getMonthlyReport(month)
    return { success: true, report }
  } catch (error: any) {
    console.error('API Error (monthly-report.get):', error)
    return { success: false, error: error.message || 'Internal server error' }
  }
})
