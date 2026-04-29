export interface GitLabEvent {
  id: string
  short_id: string
  title: string
  message: string | null
  author_name: string
  author_email: string
  authored_date: string
  committer_name: string
  committer_email: string
  committed_date: string
  web_url: string | null
  project_name: string | null
  project_path: string
  project_id: number
  branch_name: string | null
  branch_names: string[]
  action_name: string | null
  created_at: string
  target_type?: string | null
  target_title?: string | null
  push_data?: {
    ref: string
    [key: string]: unknown
  }
}

export interface GitlabCache {
  success: boolean
  events: GitLabEvent[]
  date: string
  cached?: boolean
}
