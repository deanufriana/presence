import type { GitLabEvent } from './gitlab'
import type { JiraEvent } from './jira'
import type { Holiday } from './holiday'

export interface CalendarEvent {
  date: string
  name?: string
  summary?: string
  startTime?: string
  endTime?: string
  [key: string]: unknown
}

export interface CalendarCache {
  success: boolean
  events: CalendarEvent[]
  date: string
  cached?: boolean
}

export interface CalendarDay {
  dayNum: number
  date: string
  isToday: boolean
  count: number
  commits: GitLabEvent[]
  calendarEvents: CalendarEvent[]
  jiraEvents: JiraEvent[]
  jiraCount: number
  hasManual: boolean
  holiday?: Holiday
  isHoliday: boolean
}
