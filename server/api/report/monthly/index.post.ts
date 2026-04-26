export default defineEventHandler(async (event): Promise<any> => {
  try {
    const body = await readBody(event)
    const { month, rows, summary } = body

    if (!month) return { success: false, error: 'Month required' }

    const data = {
      month,
      rows: Array.isArray(rows) ? JSON.stringify(rows) : undefined,
      summary: typeof summary === 'string' ? summary : undefined
    }

    const updated = await prisma.monthlyReport.upsert({
      where: { month },
      update: {
        ...(data.rows !== undefined && { rows: data.rows }),
        ...(data.summary !== undefined && { summary: data.summary })
      },
      create: {
        month,
        rows: data.rows || '[]',
        summary: data.summary || ''
      }
    })

    return { success: true, report: updated }
  } catch (error: any) {
    console.error('API Error (monthly-report.post):', error)
    return { success: false, error: error.message || 'Internal server error' }
  }
})
