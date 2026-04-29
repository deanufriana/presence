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
      ...report,
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return { success: false, error: msg }
  }
})
