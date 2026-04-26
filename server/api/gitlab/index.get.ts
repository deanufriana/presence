export default defineEventHandler(async (event): Promise<any> => {
  const query = getQuery(event)
  const dateStr: string = (query.date as string) || new Date().toISOString().split('T')[0] || ''
  const force = query.force === 'true'

  try {
    return await syncGitLabEvents(dateStr, force)
  } catch (error: any) {
    return { success: false, error: error.message, events: [] }
  }
})
