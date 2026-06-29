import { getDb, schema } from '~/db'
import { sql, asc } from 'drizzle-orm'

export async function getCalendarEventsByMonth(month: string) {
  const db = await getDb()
  return await db.query.calendarEvents.findMany({
    where: sql`${schema.calendarEvents.date} LIKE ${month + '%'}`,
    orderBy: asc(schema.calendarEvents.date),
  })
}

export async function deleteCalendarEventsByMonth(month: string) {
  const db = await getDb()
  await db
    .delete(schema.calendarEvents)
    .where(sql`${schema.calendarEvents.date} LIKE ${month + '%'}`)
}

export async function insertCalendarEvents(
  events: {
    date: string
    summary: string
    startTime?: string
    endTime?: string
  }[],
) {
  const db = await getDb()
  if (events.length === 0) return
  await db.insert(schema.calendarEvents).values(
    events.map((e) => ({
      ...e,
      updatedAt: new Date(),
    })),
  )
}

export async function getHolidaysByMonth(datePrefix: string) {
  const db = await getDb()
  return await db.query.holidays.findMany({
    where: sql`${schema.holidays.date} LIKE ${datePrefix + '%'}`,
  })
}

export async function upsertHoliday(h: {
  holiday_date: string
  holiday_name: string
  is_holiday: boolean
}) {
  const db = await getDb()
  if (h.is_holiday) {
    await db
      .insert(schema.holidays)
      .values({
        date: h.holiday_date,
        name: h.holiday_name,
        isHoliday: h.is_holiday,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [schema.holidays.date, schema.holidays.name],
        set: { isHoliday: h.is_holiday, updatedAt: new Date() },
      })
  } else {
    await deleteHolidayByDate(h.holiday_date)
  }
}

export async function upsertManualHoliday(data: {
  date: string
  name: string
  isHoliday: boolean
}) {
  const db = await getDb()
  await db
    .insert(schema.holidays)
    .values({
      ...data,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [schema.holidays.date, schema.holidays.name],
      set: { isHoliday: data.isHoliday, updatedAt: new Date() },
    })
}

export async function deleteHolidayByDate(date: string) {
  const db = await getDb()
  const { eq } = await import('drizzle-orm')
  await db.delete(schema.holidays).where(eq(schema.holidays.date, date))
}
