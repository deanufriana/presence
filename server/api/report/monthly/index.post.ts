export default defineEventHandler(async (event): Promise<any> => {
  try {
    const body = await readBody(event)
    const { month, rows, summary } = body

    if (!month) return { success: false, error: 'Month required' }

    const updated = await prisma.monthlyReport.upsert({
      where: { month },
      update: {
        rows: rows ? JSON.stringify(rows) : undefined,
        summary: summary !== undefined ? summary : undefined
      },
      create: {
        month,
        rows: rows ? JSON.stringify(rows) : '[]',
        summary: summary || ''
      }
    })

    return { success: true, report: updated }
  } catch (error: any) {
    console.error('API Error (monthly-report.post):', error)
    return { success: false, error: error.message || 'Internal server error' }
  }
})
