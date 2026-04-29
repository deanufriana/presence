export interface JiraEvent {
  id: string
  key: string
  summary: string
  type: string
  status: string | null
  project_name: string | null
  updated_at: string
  web_url: string | null
}

export interface JiraCache {
  success: boolean
  events: JiraEvent[]
  date: string
  cached?: boolean
}
