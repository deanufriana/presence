export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { year } = body

  if (!year) {
    return { success: false, error: 'Year is required' }
  }

  try {
    const summaries = await getAllMonthlySummaries(year)

    // Aggregate monthly summaries into a format for the prompt
    const monthlySummaries = summaries.map((s) => `[Month: ${s.period}]\n${s.summary}`)

    if (monthlySummaries.length === 0) {
      return {
        success: false,
        error: 'No monthly summaries found for this year. Please generate monthly reports first.',
      }
    }

    const prompt = getYearlyPrompt(monthlySummaries)
    const rawContent = await generateSummary(prompt, { max_tokens: 5000, think: true })
    const rows = parseYearlyMarkdown(rawContent)
    // Persist the summary and rows
    const report = await upsertYearlyReport({
      year,
      summary: rawContent.trim(),
      rows,
    })

    return {
      success: true,
      ...report,
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('AI Yearly Summary Error:', error)
    return { success: false, error: msg || 'Failed to generate AI summary' }
  }
})
