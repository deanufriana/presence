export default defineEventHandler(async (event): Promise<any> => {
  const body = await readBody(event)
  const { month } = body

  if (!month) {
    return { success: false, error: 'Month is required' }
  }

  try {
    const dailyReports = await getDailyReports(month)
    const activities = dailyReports
      .map(r => r.aktivitas)
      .filter((act): act is string => !!act && act.length > 5)

    if (activities.length === 0) {
      return { success: false, error: 'No activities found for this month' }
    }

    const prompt = getMonthlyPrompt(activities)
    const rawContent = await generateSummary(prompt, { max_tokens: 3000, think: true })

    // Parse the markdown output into structured rows
    const rows = parseMonthlyMarkdown(rawContent)

    // Persist the summary (raw markdown) and parsed rows
    const report = await upsertMonthlyReport({
      month,
      summary: rawContent.trim(),
      rows
    })

    return {
      success: true,
      summary: report.summary,
      rows: report.rows
    }
  } catch (error: any) {
    console.error('AI Monthly Summary Error:', error)
    return { success: false, error: error.message || 'Failed to generate AI summary' }
  }
})
