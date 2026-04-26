export default defineEventHandler(async (event): Promise<any> => {
  try {
    const body = await readBody(event)
    const { month, rows, summary } = body

    if (!month) return { success: false, error: 'Month required' }

    const updated = await upsertMonthlyReport({
      month,
      summary,
      rows
    })

    return { success: true, report: updated }
  } catch (error: any) {
    console.error('API Error (monthly-report.post):', error)
    return { success: false, error: error.message || 'Internal server error' }
  }
})
