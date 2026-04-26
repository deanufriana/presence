
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const month = query.month as string

  if (!month) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Month required'
    })
  }

  try {
    const latest = await prisma.summaryLog.findFirst({
      where: { month },
      orderBy: { createdAt: 'desc' }
    })

    return { 
      success: true, 
      summary: latest?.summary || '',
      id: latest?.id,
      createdAt: latest?.createdAt
    }
  } catch (error: any) {
    console.error('API Error (monthly.summary.get):', error)
    return { success: false, error: error.message }
  }
})
