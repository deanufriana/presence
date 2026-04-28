export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const year = query.year as string

  if (!year) {
    return { success: false, error: 'Year is required' }
  }

  try {
    const report = await getYearlyReport(year)
    return {
      success: true,
      ...report
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})
