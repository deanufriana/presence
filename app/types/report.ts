export interface ReportRow {
  date: string
  masuk: string
  pulang: string
  ti: string
  aktivitas: string
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

export interface JiraChildTask {
  id?: string
  title: string
  description: string
}

export interface YearlyActivityMonth {
  month: string
  hasGitlab: boolean
  hasJira: boolean
  hasCalendar: boolean
  hasDaily: boolean
  hasActivity: boolean
}
