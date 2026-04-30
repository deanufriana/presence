import { drizzle } from 'drizzle-orm/sqlite-proxy'
import Database from '@tauri-apps/plugin-sql'
import * as schema from './schema'

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null
let _initialized = false

export { schema }

export async function getDb() {
  if (_db && _initialized) return _db

  const sqlite = await Database.load('sqlite:presence.db')

  if (!_initialized) {
    const queries = [
      'CREATE TABLE IF NOT EXISTS Setting (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE NOT NULL, value TEXT NOT NULL, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL)',
      'CREATE TABLE IF NOT EXISTS GitLabCommit (id TEXT PRIMARY KEY, shortId TEXT NOT NULL, title TEXT NOT NULL, message TEXT, authorName TEXT NOT NULL, authorEmail TEXT NOT NULL, authoredDate INTEGER NOT NULL, committerName TEXT NOT NULL, committerEmail TEXT NOT NULL, committedDate INTEGER NOT NULL, webUrl TEXT NOT NULL, projectName TEXT NOT NULL, projectPath TEXT NOT NULL, projectId INTEGER NOT NULL, branchName TEXT, branchNames TEXT, actionName TEXT, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL)',
      'CREATE TABLE IF NOT EXISTS CalendarEvent (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, summary TEXT NOT NULL, startTime TEXT, endTime TEXT, updatedAt INTEGER NOT NULL)',
      'CREATE TABLE IF NOT EXISTS DailyReport (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT UNIQUE NOT NULL, masuk TEXT, pulang TEXT, ti TEXT, aktivitas TEXT, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL)',
      'CREATE TABLE IF NOT EXISTS MonthlyReport (id INTEGER PRIMARY KEY AUTOINCREMENT, month TEXT NOT NULL, project TEXT, progres TEXT, done TEXT, status TEXT, sources TEXT, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL)',
      'CREATE TABLE IF NOT EXISTS SummaryLog (id INTEGER PRIMARY KEY AUTOINCREMENT, period TEXT UNIQUE NOT NULL, summary TEXT, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL)',
      'CREATE TABLE IF NOT EXISTS JiraActivity (id TEXT PRIMARY KEY, key TEXT NOT NULL, summary TEXT NOT NULL, type TEXT NOT NULL, status TEXT, projectName TEXT, updatedAt INTEGER NOT NULL, userEmail TEXT NOT NULL, webUrl TEXT)',
      'CREATE TABLE IF NOT EXISTS YearlyReport (id INTEGER PRIMARY KEY AUTOINCREMENT, year TEXT NOT NULL, tanggal TEXT, month TEXT, task TEXT, deliverable TEXT, status TEXT, keterangan TEXT, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL)',
      'CREATE TABLE IF NOT EXISTS Holiday (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, name TEXT NOT NULL, is_holiday INTEGER NOT NULL, type TEXT, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL)',
      'CREATE INDEX IF NOT EXISTS authorEmailIdx ON GitLabCommit (authorEmail)',
      'CREATE INDEX IF NOT EXISTS createdAtIdx ON GitLabCommit (createdAt)',
      'CREATE INDEX IF NOT EXISTS dateIdx ON CalendarEvent (date)',
      'CREATE INDEX IF NOT EXISTS monthIdx ON MonthlyReport (month)',
      'CREATE INDEX IF NOT EXISTS periodIdx ON SummaryLog (period)',
      'CREATE INDEX IF NOT EXISTS userEmailIdx ON JiraActivity (userEmail)',
      'CREATE INDEX IF NOT EXISTS updatedAtIdx ON JiraActivity (updatedAt)',
      'CREATE INDEX IF NOT EXISTS yearIdx ON YearlyReport (year)',
      'CREATE UNIQUE INDEX IF NOT EXISTS dateNameUnique ON Holiday (date, name)',
      'CREATE INDEX IF NOT EXISTS holidayDateIdx ON Holiday (date)',
    ]

    for (const q of queries) {
      await sqlite.execute(q)
    }
    _initialized = true
  }

  if (!_db) {
    _db = drizzle(
      async (sql, params, method) => {
        const sqlParams = params || []
        if (method === 'run') {
          await sqlite.execute(sql, sqlParams)
          return { rows: [] }
        }

        const rows = await sqlite.select<Record<string, unknown>[]>(sql, sqlParams)
        const mappedRows = rows.map((row) => Object.values(row))

        if (method === 'get') {
          return { rows: mappedRows[0] }
        }

        return { rows: mappedRows }
      },
      { schema },
    )
  }

  return _db
}
