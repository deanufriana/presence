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
      updatedAt: event.updatedAt,
      userEmail: event.userEmail,
      webUrl: event.webUrl,
    })
    .onConflictDoUpdate({
      target: schema.jiraActivities.id,
      set: {
        key: event.key,
        summary: event.summary,
        type: event.type,
        status: event.status,
        projectName: event.project_name,
        updatedAt: event.updatedAt,
        userEmail: event.userEmail,
        webUrl: event.webUrl,
      },
    })
}
