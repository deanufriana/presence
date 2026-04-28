export interface ReportRow {
  date: string;
  masuk: string;
  pulang: string;
  ti: string;
  aktivitas: string;
}

export interface ReportResponse {
  success: boolean;
  report: string;
  rows: ReportRow[];
  raw: {
    gitlab: {
      success: boolean;
      events: any[];
      error?: string;
      cached?: boolean;
    };
    jira?: {
      success: boolean;
      events: any[];
      error?: string;
      cached?: boolean;
    };
  };
}

export interface SettingsData {
  gitlab_token: string;
  gitlab_url: string;
  gitlab_selected_projects: string;
  jira_token: string;
  jira_url: string;
  jira_email: string;
  ai_api_key: string;
  openai_api_key: string;
  ai_provider: 'gemini' | 'openai' | 'ollama';
  ai_model: string;
  ollama_url: string;
  user_name: string;
  user_position: string;
  user_nopeg: string;
  user_unit: string;
  user_function: string;
  // Document Signatories
  team_leader_name: string;
  team_leader_position: string;
  dept_head_name: string;
  dept_head_position: string;
  div_head_name: string;
  div_head_position: string;
}

export interface MonthlyReportRow {
  month: string;
  project: string;
  progres: string;
  done: string;
  status: string;
  sources?: string[];
}

export interface YearlyReportRow {
  tanggal: string;
  month: string;
  task: string;
  deliverable: string;
  status: string;
  keterangan: string;
}
