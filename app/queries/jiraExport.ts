import { getDb, schema } from '~/db'
import { eq, and } from 'drizzle-orm'

export async function getJiraExportData(month: string, project: string) {
  const db = await getDb()
  return await db.query.jiraExportData.findFirst({
    where: and(eq(schema.jiraExportData.month, month), eq(schema.jiraExportData.project, project)),
  })
}

export async function getJiraExportDataByMonth(month: string) {
  const db = await getDb()
  return await db.query.jiraExportData.findMany({
    where: eq(schema.jiraExportData.month, month),
  })
}

export async function upsertJiraExportData(data: {
  month: string
  project: string
  description?: string | null
  childTasks?: string | null
}) {
  const db = await getDb()

  const existing = await db.query.jiraExportData.findFirst({
    where: and(
      eq(schema.jiraExportData.month, data.month),
      eq(schema.jiraExportData.project, data.project),
    ),
  })

  if (existing) {
    await db
      .update(schema.jiraExportData)
      .set({
        description: data.description ?? existing.description,
        childTasks: data.childTasks ?? existing.childTasks,
        updatedAt: new Date(),
      })
      .where(eq(schema.jiraExportData.id, existing.id))
    return { ...existing, ...data }
  }

  await db.insert(schema.jiraExportData).values({
    month: data.month,
    project: data.project,
    description: data.description || null,
    childTasks: data.childTasks || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return await getJiraExportData(data.month, data.project)
}

export async function deleteJiraExportData(month: string, project: string) {
  const db = await getDb()
  await db
    .delete(schema.jiraExportData)
    .where(and(eq(schema.jiraExportData.month, month), eq(schema.jiraExportData.project, project)))
}
