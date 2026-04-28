import { format } from 'date-fns'

export default defineEventHandler(async (event): Promise<any> => {
  const dateStr = getRouterParam(event, 'date') || format(new Date(), 'yyyy-MM')
  const query = getQuery(event)
  const force = query.force === 'true'

  try {
    const [gitlab, jira] = await Promise.all([
      syncGitLabEvents(dateStr, force),
      syncJiraActivities(dateStr, force)
    ])

    return {
      success: true,
      gitlab,
      jira
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
})
