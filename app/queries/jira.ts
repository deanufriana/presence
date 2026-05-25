import { getDb, schema } from '~/db'
import { gte, lte, and } from 'drizzle-orm'
import type { JiraEvent } from '~/types/report'

export async function getJiraActivitiesByPeriod(firstDay: Date, lastDay: Date) {
  const db = await getDb()
  return await db.query.jiraActivities.findMany({
    where: and(
      gte(schema.jiraActivities.updatedAt, firstDay),
      lte(schema.jiraActivities.updatedAt, lastDay),
    ),
    orderBy: (activities, { desc }) => [desc(activities.updatedAt)],
  })
}

export async function upsertJiraActivity(event: JiraEvent) {
  const db = await getDb()
  await db
    .insert(schema.jiraActivities)
    .values({
      id: event.id,
      key: event.key,
      summary: event.summary,
      type: event.type,
      status: event.status,
      projectName: event.project_name,
      updatedAt: new Date(event.updated_at),
      userEmail: event.user_email,
      webUrl: event.web_url,
    })
    .onConflictDoUpdate({
      target: schema.jiraActivities.id,
      set: {
        key: event.key,
        summary: event.summary,
        type: event.type,
        status: event.status,
        projectName: event.project_name,
        updatedAt: new Date(event.updated_at),
        userEmail: event.user_email,
        webUrl: event.web_url,
      },
    })
}

export async function getJiraActivitiesByDates(dates: string[]) {
  if (!dates || dates.length === 0) return []
  const db = await getDb()
  const { format } = await import('date-fns')

  const sorted = [...dates].sort()
  const startDate = `${sorted[0]}T00:00:00`
  const endDate = `${sorted[sorted.length - 1]}T23:59:59`

  const activities = await db.query.jiraActivities.findMany({
    where: and(
      gte(schema.jiraActivities.updatedAt, new Date(startDate)),
      lte(schema.jiraActivities.updatedAt, new Date(endDate)),
    ),
  })

  const dateSet = new Set(dates)
  return activities.filter((act) => {
    try {
      const dateStr = format(act.updatedAt, 'yyyy-MM-dd')
      return dateSet.has(dateStr)
    } catch {
      return false
    }
  })
}
