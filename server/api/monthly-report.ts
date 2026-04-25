import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event): Promise<any> => {
  const method = event.method
  const query = getQuery(event)

  try {
    if (method === 'GET') {
      const month = query.month as string // e.g., "2024-04"
      if (!month) return { success: false, error: 'Month required' }

      const report = await prisma.monthlyReport.findUnique({
        where: { month }
      })

      if (!report) return { success: true, report: null }

      return {
        success: true,
        report: {
          ...report,
          rows: report.rows ? JSON.parse(report.rows) : []
        }
      }
    }

    if (method === 'POST') {
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
    }

    return { success: false, error: 'Method not allowed' }
  } catch (error: any) {
    console.error('API Error (monthly-report):', error)
    return { success: false, error: error.message || 'Internal server error' }
  }
})
