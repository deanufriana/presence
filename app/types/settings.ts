export interface SettingsData {
  gitlab_token: string
  gitlab_url: string
  gitlab_selected_projects: string
  jira_token: string
  jira_url: string
  jira_email: string
  gemini_api_key: string
  openai_api_key: string
  deepseek_api_key: string
  ai_provider: 'gemini' | 'openai' | 'ollama' | 'deepseek'
  ai_model: string
  ollama_url: string
  user_name: string
  user_position: string
  user_nopeg: string
  user_unit: string
  user_function: string
  // Document Signatories
  team_leader_name: string
  team_leader_position: string
  dept_head_name: string
  dept_head_position: string
  div_head_name: string
  div_head_position: string
  jira_default_project?: string
  jira_default_issuetype?: string
  jira_selected_projects?: string
}
