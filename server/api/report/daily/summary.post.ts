export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { activities } = body

  if (!activities || !Array.isArray(activities) || activities.length === 0) {
    return { success: false, error: 'No activities provided' }
  }

  try {
    const prompt = getDailyPrompt(activities)
    const summary = await generateSummary(prompt, { max_tokens: 500, think: false })

    return { success: true, summary }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('AI Daily Summary Error:', error)
    return { success: false, error: msg || 'Failed to generate AI summary' }
  }
})
