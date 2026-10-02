/**
 * Single source of truth for default settings values.
 *
 * These were duplicated across the core store, the API clients and the settings
 * UI, and had already drifted: the AI clients fell back to different model ids
 * than the UI displayed (gemini-2.0-flash vs -flash-lite, gpt-4o vs -mini), so
 * an unset ai_model silently ran a different model than the user picked.
 */
export const DEFAULT_GITLAB_URL = 'https://gitlab-ce.brilife.co.id'
export const DEFAULT_OLLAMA_URL = 'http://localhost:11434'
export const DEFAULT_AI_PROVIDER = 'gemini'

/** Default model per provider, matching the options offered in Settings. */
export const DEFAULT_AI_MODEL = {
  gemini: 'gemini-2.0-flash-lite',
  openai: 'gpt-4o-mini',
  deepseek: 'deepseek-chat',
  ollama: 'gemma:latest',
} as const satisfies Record<string, string>
