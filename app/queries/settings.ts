import { getDb, schema } from '~/db'
import { eq, sql } from 'drizzle-orm'
import type { SettingsData } from '~/types/report'

export async function fetchAllSettings(): Promise<Partial<SettingsData>> {
  const db = await getDb()
  const allSettings = await db.query.settings.findMany()

  const data: Partial<SettingsData> = {}
  allSettings.forEach((s) => {
    ;(data as Record<string, string>)[s.key] = s.value
  })
  return data
}

export async function upsertSetting(key: string, value: string) {
  const db = await getDb()
  await db
    .insert(schema.settings)
    .values({
      key,
      value,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.settings.key,
      set: { value, updatedAt: new Date() },
    })
}

export async function upsertSettingsBatch(settings: Record<string, string>) {
  const db = await getDb()
  const values = Object.entries(settings).map(([key, value]) => ({
    key,
    value,
    updatedAt: new Date(),
  }))

  if (values.length === 0) return

  await db
    .insert(schema.settings)
    .values(values)
    .onConflictDoUpdate({
      target: schema.settings.key,
      set: {
        value: sql`excluded.value`,
        updatedAt: sql`excluded.updatedAt`,
      },
    })
}

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb()
  const s = await db.query.settings.findFirst({
    where: eq(schema.settings.key, key),
  })
  return s?.value || null
}
