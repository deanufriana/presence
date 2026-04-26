

export default defineEventHandler(async (event): Promise<any> => {
  try {
    const body = await readBody(event)
    if (!body) return { success: false, error: 'Request body required' }

    // Support batch updates
    if (Array.isArray(body)) {
      const validRows = body.filter(r => r && r.date)
      if (validRows.length === 0) return { success: true, count: 0 }

      // Use transaction for reliability
      await prisma.$transaction(
        validRows.map(item =>
          prisma.dailyReport.upsert({
            where: { date: item.date },
            update: {
              masuk: item.masuk ?? undefined,
              pulang: item.pulang ?? undefined,
              ti: item.ti ?? undefined,
              aktivitas: item.aktivitas ?? undefined
            },
            create: {
              date: item.date,
              masuk: item.masuk || '',
              pulang: item.pulang || '',
              ti: item.ti || '',
              aktivitas: item.aktivitas || ''
            }
          })
        )
      )
      return { success: true, count: validRows.length }
    }

    // Support single update
    const { date, activity, masuk, pulang, ti } = body
    if (!date) return { success: false, error: 'Date required' }

    const updated = await prisma.dailyReport.upsert({
      where: { date },
      update: {
        aktivitas: activity !== undefined ? activity : undefined,
        masuk: masuk ?? undefined,
        pulang: pulang ?? undefined,
        ti: ti ?? undefined
      },
      create: {
        date,
        aktivitas: activity || '',
        masuk: masuk || '',
        pulang: pulang || '',
        ti: ti || ''
      }
    })

    return { success: true, report: updated }
  } catch (error: any) {
    console.error('API Error (daily-report.post):', error)
    return { success: false, error: error.message || 'Internal server error' }
  }
})
