export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { month, rows, summary } = body

    if (!month) return { success: false, error: 'Month required' }

    const updated = await upsertMonthlyReport({
      month,
      summary,
      rows,
    })

    return { success: true, report: updated }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('API Error (monthly-report.post):', error)
    return { success: false, error: msg || 'Internal server error' }
  }
})
