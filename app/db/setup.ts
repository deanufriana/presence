import type { getDb } from './index'

export async function initSchema(db: Awaited<ReturnType<typeof getDb>>) {
  // We use raw SQL to ensure tables exist since Drizzle Proxy doesn't handle migrations automatically in the frontend
  const queries = [
    `CREATE TABLE IF NOT EXISTS Setting (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS GitLabCommit (
      id TEXT PRIMARY KEY,
      shortId TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      authorName TEXT NOT NULL,
      authorEmail TEXT NOT NULL,
      authoredDate INTEGER NOT NULL,
      committerName TEXT NOT NULL,
      committerEmail TEXT NOT NULL,
      committedDate INTEGER NOT NULL,
      webUrl TEXT NOT NULL,
      projectName TEXT NOT NULL,
      projectPath TEXT NOT NULL,
      projectId INTEGER NOT NULL,
      branchName TEXT,
      branchNames TEXT,
      actionName TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS CalendarEvent (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      summary TEXT NOT NULL,
      startTime TEXT,
      endTime TEXT,
      updatedAt INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS DailyReport (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      masuk TEXT,
      pulang TEXT,
      ti TEXT,
      aktivitas TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS MonthlyReport (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month TEXT NOT NULL,
      project TEXT,
      progres TEXT,
      done TEXT,
      status TEXT,
      sources TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS SummaryLog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period TEXT UNIQUE NOT NULL,
      summary TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS JiraActivity (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL,
      summary TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT,
      projectName TEXT,
      updatedAt INTEGER NOT NULL,
      userEmail TEXT NOT NULL,
      webUrl TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS YearlyReport (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year TEXT NOT NULL,
      tanggal TEXT,
      month TEXT,
      task TEXT,
      deliverable TEXT,
      status TEXT,
      keterangan TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS Holiday (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      name TEXT NOT NULL,
      is_holiday INTEGER NOT NULL,
      type TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )`,
    // Indexes
    `CREATE INDEX IF NOT EXISTS authorEmailIdx ON GitLabCommit (authorEmail)`,
    `CREATE INDEX IF NOT EXISTS createdAtIdx ON GitLabCommit (createdAt)`,
    `CREATE INDEX IF NOT EXISTS dateIdx ON CalendarEvent (date)`,
    `CREATE INDEX IF NOT EXISTS monthIdx ON MonthlyReport (month)`,
    `CREATE INDEX IF NOT EXISTS periodIdx ON SummaryLog (period)`,
    `CREATE INDEX IF NOT EXISTS userEmailIdx ON JiraActivity (userEmail)`,
    `CREATE INDEX IF NOT EXISTS updatedAtIdx ON JiraActivity (updatedAt)`,
    `CREATE INDEX IF NOT EXISTS yearIdx ON YearlyReport (year)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS dateNameUnique ON Holiday (date, name)`,
    `CREATE INDEX IF NOT EXISTS holidayDateIdx ON Holiday (date)`,
  ]

  for (const query of queries) {
    try {
      // access internal sqlite execute via proxy or just use the db.run if available
      // Since we're using the proxy, we can just execute raw SQL via the bridge
      await (
        db as unknown as { $client: { execute: (q: string) => Promise<void> } }
      ).$client.execute(query)
    } catch (e) {
      console.error('Failed to run init query:', query, e)
    }
  }
}
