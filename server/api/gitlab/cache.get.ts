export default defineEventHandler(async (event): Promise<any> => {
  const query = getQuery(event)
  const dateStr = query.date as string || new Date().toISOString().slice(0, 7)

  try {
    return await getGitLabCache(dateStr)
  } catch (error: any) {
    return { success: false, error: error.message, events: [] }
  }
})
