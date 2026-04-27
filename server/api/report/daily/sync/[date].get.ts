export default defineEventHandler(async (event): Promise<any> => {
  const dateStr = event.context.params?.date as string
  if (!dateStr) {
    throw createError({ statusCode: 400, message: 'Date is required' })
  }

  try {
    const grouped = await fetchAndGroupActivities(dateStr, false)
    const activities = grouped[dateStr] || []

    const report = await upsertDailyReport({
      date: dateStr,
      activities
    })

    return {
      success: true,
      data: report
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
})
