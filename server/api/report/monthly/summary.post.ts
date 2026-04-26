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

    // Get month name for prompt context
    const [year, monthNum] = month.split('-')
    const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date(parseInt(year), parseInt(monthNum) - 1))

    const prompt = getMonthlyPrompt(activities, monthName)
    const rawContent = await generateSummary(prompt, { max_tokens: 1000 })
    
    // Improved JSON extraction using regex
    let jsonStr = ""
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    } else {
      jsonStr = rawContent.trim()
    }

    try {
      const parsed = JSON.parse(jsonStr)
      return { 
        success: true, 
        summary: parsed.summary || "", 
        rows: parsed.rows || [] 
      }
    } catch (parseError) {
      console.error('Failed to parse AI monthly JSON. Raw content:', rawContent)
      // Fallback: if parsing fails, return as summary
      return { success: true, summary: rawContent, rows: [] }
    }
  } catch (error: any) {
    console.error('AI Monthly Summary Error:', error)
    return { success: false, error: error.message || 'Failed to generate AI summary' }
  }
})
