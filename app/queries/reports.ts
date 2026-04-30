import { getDb, schema } from '~/db'
import { eq, sql, asc, gte, lte, and } from 'drizzle-orm'
import type { MonthlyReportRow, YearlyReportRow } from '~/types/report'

export async function getDailyReports(datePrefix: string) {
  const db = await getDb()
  return await db.query.dailyReports.findMany({
    where: sql`${schema.dailyReports.date} LIKE ${datePrefix + '%'}`,
    orderBy: asc(schema.dailyReports.date),
  })
}

export async function getMonthlyReport(month: string) {
  const db = await getDb()
  const rows = await db.query.monthlyReports.findMany({
    where: eq(schema.monthlyReports.month, month),
    orderBy: asc(schema.monthlyReports.createdAt),
  })

  const summaryLog = await db.query.summaryLogs.findFirst({
    where: eq(schema.summaryLogs.period, month),
    orderBy: (summaryLogs, { desc }) => [desc(summaryLogs.createdAt)],
  })

  return {
    rows: rows.map((r) => ({
      ...r,
      sources: r.sources ? JSON.parse(r.sources) : [],
    })),
    summary: summaryLog?.summary || '',
  }
}

export async function upsertDailyReport(
  date: string,
  data: Partial<typeof schema.dailyReports.$inferInsert>,
) {
  const db = await getDb()
  const existing = await db.query.dailyReports.findFirst({
    where: eq(schema.dailyReports.date, date),
  })

  if (existing) {
    await db
      .update(schema.dailyReports)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.dailyReports.date, date))
  } else {
    await db.insert(schema.dailyReports).values({
      date,
      masuk: data.masuk || null,
      pulang: data.pulang || null,
      ti: data.ti || null,
      aktivitas: data.aktivitas || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }
  return await db.query.dailyReports.findFirst({ where: eq(schema.dailyReports.date, date) })
}

export async function deleteDailyReport(date: string) {
  const db = await getDb()
  await db.delete(schema.dailyReports).where(eq(schema.dailyReports.date, date))
}

export async function upsertMonthlyReport(
  month: string,
  summary?: string,
  rows?: MonthlyReportRow[],
) {
  const db = await getDb()

  if (summary !== undefined) {
    await db
      .insert(schema.summaryLogs)
      .values({
        period: month,
        summary: summary || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.summaryLogs.period,
        set: { summary: summary || '', updatedAt: new Date() },
      })
  }

  if (Array.isArray(rows)) {
    await db.delete(schema.monthlyReports).where(eq(schema.monthlyReports.month, month))
    for (const row of rows) {
      await db.insert(schema.monthlyReports).values({
        month,
        project: row.project,
        progres: row.progres,
        done: row.done,
        status: row.status,
        sources: row.sources ? JSON.stringify(row.sources) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
  }
  return await getMonthlyReport(month)
}

export async function getYearlyReport(year: string) {
  const db = await getDb()
  const rows = await db.query.yearlyReports.findMany({
    where: eq(schema.yearlyReports.year, year),
    orderBy: asc(schema.yearlyReports.tanggal),
  })

  const summaryLog = await db.query.summaryLogs.findFirst({
    where: eq(schema.summaryLogs.period, year),
    orderBy: (summaryLogs, { desc }) => [desc(summaryLogs.createdAt)],
  })

  return {
    rows: rows || [],
    summary: summaryLog?.summary || '',
  }
}

export async function upsertYearlyReport(year: string, summary?: string, rows?: YearlyReportRow[]) {
  const db = await getDb()

  if (summary !== undefined) {
    await db
      .insert(schema.summaryLogs)
      .values({
        period: year,
        summary: summary || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.summaryLogs.period,
        set: { summary: summary || '', updatedAt: new Date() },
      })
  }

  if (Array.isArray(rows)) {
    await db.delete(schema.yearlyReports).where(eq(schema.yearlyReports.year, year))
    for (const row of rows) {
      await db.insert(schema.yearlyReports).values({
        year,
        tanggal: row.tanggal,
        month: row.month,
        task: row.task,
        deliverable: row.deliverable,
        status: row.status,
        keterangan: row.keterangan,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
  }
  return await getYearlyReport(year)
}

export async function getAllMonthlySummaries(year: string) {
  const db = await getDb()
  const summaries = await db.query.summaryLogs.findMany({
    where: sql`${schema.summaryLogs.period} LIKE ${year + '-%'}`,
    orderBy: asc(schema.summaryLogs.period),
  })

  return summaries.map((s) => ({
    period: s.period,
    summary: s.summary,
  }))
}

export async function getMonthlyActivityStatus(year: string) {
  const db = await getDb()
  const startDate = new Date(`${year}-01-01T00:00:00Z`)
  const endDate = new Date(`${year}-12-31T23:59:59Z`)

  const [gitlabDates, jiraDates, calendarEvents, dailyReports] = await Promise.all([
    db.query.gitlabCommits.findMany({
      where: and(
        gte(schema.gitlabCommits.createdAt, startDate),
        lte(schema.gitlabCommits.createdAt, endDate),
      ),
      columns: { createdAt: true },
    }),
    db.query.jiraActivities.findMany({
      where: and(
        gte(schema.jiraActivities.updatedAt, startDate),
        lte(schema.jiraActivities.updatedAt, endDate),
      ),
      columns: { updatedAt: true },
    }),
    db.query.calendarEvents.findMany({
      where: sql`${schema.calendarEvents.date} LIKE ${year + '%'}`,
      columns: { date: true },
    }),
    db.query.dailyReports.findMany({
      where: sql`${schema.dailyReports.date} LIKE ${year + '%'}`,
      columns: { date: true },
    }),
  ])

  return { gitlabDates, jiraDates, calendarEvents, dailyReports }
}
