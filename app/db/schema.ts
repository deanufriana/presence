import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const settings = sqliteTable('Setting', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').unique().notNull(),
  value: text('value').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const gitlabCommits = sqliteTable('GitLabCommit', {
  id: text('id').primaryKey(),
  shortId: text('shortId').notNull(),
  title: text('title').notNull(),
  message: text('message'),
  authorName: text('authorName').notNull(),
  authorEmail: text('authorEmail').notNull(),
  authoredDate: integer('authoredDate', { mode: 'timestamp' }).notNull(),
  committerName: text('committerName').notNull(),
  committerEmail: text('committerEmail').notNull(),
  committedDate: integer('committedDate', { mode: 'timestamp' }).notNull(),
  webUrl: text('webUrl').notNull(),
  projectName: text('projectName').notNull(),
  projectPath: text('projectPath').notNull(),
  projectId: integer('projectId').notNull(),
  branchName: text('branchName'),
  branchNames: text('branchNames'),
  actionName: text('actionName'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const gitlabCommitsAuthorEmailIdx = index('authorEmailIdx').on(gitlabCommits.authorEmail)
export const gitlabCommitsCreatedAtIdx = index('createdAtIdx').on(gitlabCommits.createdAt)

export const calendarEvents = sqliteTable('CalendarEvent', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(),
  summary: text('summary').notNull(),
  startTime: text('startTime'),
  endTime: text('endTime'),
  updatedAt: integer('updatedAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const calendarEventsDateIdx = index('dateIdx').on(calendarEvents.date)

export const dailyReports = sqliteTable('DailyReport', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').unique().notNull(),
  masuk: text('masuk'),
  pulang: text('pulang'),
  ti: text('ti'),
  aktivitas: text('aktivitas'),
  createdAt: integer('createdAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const monthlyReports = sqliteTable('MonthlyReport', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  month: text('month').notNull(),
  project: text('project'),
  progres: text('progres'),
  done: text('done'),
  status: text('status'),
  sources: text('sources'),
  createdAt: integer('createdAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const monthlyReportsMonthIdx = index('monthIdx').on(monthlyReports.month)

export const summaryLogs = sqliteTable('SummaryLog', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  period: text('period').unique().notNull(),
  summary: text('summary'),
  createdAt: integer('createdAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const summaryLogsPeriodIdx = index('periodIdx').on(summaryLogs.period)

export const jiraActivities = sqliteTable('JiraActivity', {
  id: text('id').primaryKey(),
  key: text('key').notNull(),
  summary: text('summary').notNull(),
  type: text('type').notNull(),
  status: text('status'),
  projectName: text('projectName'),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
  userEmail: text('userEmail').notNull(),
  webUrl: text('webUrl'),
})

export const jiraActivitiesUserEmailIdx = index('userEmailIdx').on(jiraActivities.userEmail)
export const jiraActivitiesUpdatedAtIdx = index('updatedAtIdx').on(jiraActivities.updatedAt)

export const yearlyReports = sqliteTable('YearlyReport', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  year: text('year').notNull(),
  tanggal: text('tanggal'),
  month: text('month'),
  task: text('task'),
  deliverable: text('deliverable'),
  status: text('status'),
  keterangan: text('keterangan'),
  createdAt: integer('createdAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const yearlyReportsYearIdx = index('yearIdx').on(yearlyReports.year)

export const jiraExportData = sqliteTable('JiraExportData', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  month: text('month').notNull(),
  project: text('project').notNull(),
  description: text('description'),
  childTasks: text('childTasks'),
  createdAt: integer('createdAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const jiraExportDataMonthProjectIdx = uniqueIndex('monthProjectIdx').on(
  jiraExportData.month,
  jiraExportData.project,
)

export const holidays = sqliteTable('Holiday', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(),
  name: text('name').notNull(),
  isHoliday: integer('is_holiday', { mode: 'boolean' }).notNull(),
  type: text('type'),
  createdAt: integer('createdAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const holidaysDateNameUniqueIdx = uniqueIndex('dateNameUnique').on(
  holidays.date,
  holidays.name,
)
export const holidaysDateIdx = index('dateIdx').on(holidays.date)
