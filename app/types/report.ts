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
  };
}

export interface SettingsData {
  gitlab_token: string;
  gitlab_url: string;
  gitlab_selected_projects: string;
  ai_api_key: string;
  openai_api_key: string;
  ai_provider: 'gemini' | 'openai' | 'ollama';
  ai_model: string;
  ollama_url: string;
}

export interface MonthlyReportRow {
  bulan: string;
  project: string;
  progres: string;
  done: string;
  status: string;
}
