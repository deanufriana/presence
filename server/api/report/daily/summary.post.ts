export default defineEventHandler(async (event): Promise<any> => {
  const body = await readBody(event)
  const { activities } = body

  if (!activities || !Array.isArray(activities) || activities.length === 0) {
    return { success: false, error: 'No activities provided' }
  }

  try {
    const prompt = getDailyPrompt(activities)
    const summary = await generateSummary(prompt, { max_tokens: 500, think: false })

    return { success: true, summary }
  } catch (error: any) {
    console.error('AI Daily Summary Error:', error)
    return { success: false, error: error.message || 'Failed to generate AI summary' }
  }
})
