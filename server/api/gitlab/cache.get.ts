export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const dateStr = (query.date as string) || new Date().toISOString().slice(0, 7)

  try {
    return await getGitLabCache(dateStr)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return { success: false, error: msg, events: [] }
  }
})
