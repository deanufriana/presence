export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { year, rows, summary } = body

  if (!year) {
    return { success: false, error: 'Year is required' }
  }

  try {
    const report = await upsertYearlyReport({ year, rows, summary })
    return {
      success: true,
      ...report,
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return { success: false, error: msg }
  }
})
