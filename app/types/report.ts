import type { GitLabEvent } from './gitlab'
import type { JiraEvent } from './jira'

export interface ReportRow {
  date: string
  masuk: string
  pulang: string
  ti: string
  aktivitas: string
}

export interface ReportResponse {
  success: boolean
  report: string
  rows: ReportRow[]
  raw: {
    gitlab: {
      success: boolean
      events: GitLabEvent[]
      error?: string
      cached?: boolean
    }
    jira?: {
      success: boolean
      events: JiraEvent[]
      error?: string
      cached?: boolean
    }
  }
}

export interface MonthlyReportRow {
  month: string
  project: string
  progres: string
  done: string
  status: string
  sources?: string[]
}

export interface YearlyReportRow {
  tanggal: string
  month: string
  task: string
  deliverable: string
  status: string
  keterangan: string
}

export interface YearlyActivityMonth {
  month: string
  hasGitlab: boolean
  hasJira: boolean
  hasCalendar: boolean
  hasDaily: boolean
  hasActivity: boolean
}

export * from './gitlab'
export * from './jira'
export * from './calendar'
export * from './settings'
export * from './holiday'
