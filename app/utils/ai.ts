import { getDb, schema } from '~/db'
import type { OllamaModel } from '~/types/ollama'
import { eq } from 'drizzle-orm'
import { fetch } from '@tauri-apps/plugin-http'
import { stripMarkdownCodeBlock } from './format'

export interface AiOptions {
  signal?: AbortSignal
  max_tokens?: number
  temperature?: number
  think?: boolean
  provider?: string
  model?: string
  apiKey?: string
  ollamaUrl?: string
}

export async function generateSummary(prompt: string, options: AiOptions = {}) {
  let provider = options.provider
  if (!provider) {
    const db = await getDb()
    const providerSetting = await db.query.settings.findFirst({
      where: eq(schema.settings.key, 'ai_provider'),
    })
    provider = providerSetting?.value || 'gemini'
  }

  if (provider === 'gemini') {
    return await generateGemini(prompt, options)
  } else if (provider === 'openai') {
    return await generateOpenAi(prompt, options)
  } else if (provider === 'deepseek') {
    return await generateDeepSeek(prompt, options)
  } else if (provider === 'ollama') {
    return await generateOllama(prompt, options)
  }

  throw new Error(`Unsupported AI provider: ${provider}`)
}

async function generateGemini(prompt: string, options: AiOptions) {
  let apiKey = options.apiKey
  if (!apiKey) {
    const db = await getDb()
    const apiKeySetting = await db.query.settings.findFirst({
      where: eq(schema.settings.key, 'gemini_api_key'),
    })
    apiKey = apiKeySetting?.value
  }
  if (!apiKey) throw new Error('Gemini API Key not set')

  let model = options.model
  if (!model) {
    const db = await getDb()
    const modelSetting = await db.query.settings.findFirst({
      where: eq(schema.settings.key, 'ai_model'),
    })
    model = modelSetting?.value || 'gemini-2.0-flash'
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      signal: options.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: options.max_tokens || 2048,
          temperature: options.temperature || 0.7,
        },
      }),
    },
  )

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

async function generateOpenAi(prompt: string, options: AiOptions) {
  let apiKey = options.apiKey
  if (!apiKey) {
    const db = await getDb()
    const apiKeySetting = await db.query.settings.findFirst({
      where: eq(schema.settings.key, 'openai_api_key'),
    })
    apiKey = apiKeySetting?.value
  }
  if (!apiKey) throw new Error('OpenAI API Key not set')

  let model = options.model
  if (!model) {
    const db = await getDb()
    const modelSetting = await db.query.settings.findFirst({
      where: eq(schema.settings.key, 'ai_model'),
    })
    model = modelSetting?.value || 'gpt-4o'
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    signal: options.signal,
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options.max_tokens || 2048,
      temperature: options.temperature || 0.7,
    }),
  })

  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] }
  return data.choices?.[0]?.message?.content || ''
}

async function generateDeepSeek(prompt: string, options: AiOptions) {
  let apiKey = options.apiKey
  if (!apiKey) {
    const db = await getDb()
    const apiKeySetting = await db.query.settings.findFirst({
      where: eq(schema.settings.key, 'deepseek_api_key'),
    })
    apiKey = apiKeySetting?.value
  }
  if (!apiKey) throw new Error('DeepSeek API Key not set')

  let model = options.model
  if (!model) {
    const db = await getDb()
    const modelSetting = await db.query.settings.findFirst({
      where: eq(schema.settings.key, 'ai_model'),
    })
    model = modelSetting?.value || 'deepseek-chat'
  }

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    signal: options.signal,
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options.max_tokens || 2048,
      temperature: options.temperature || 0.7,
    }),
  })

  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] }
  return data.choices?.[0]?.message?.content || ''
}

async function generateOllama(prompt: string, options: AiOptions) {
  let baseUrl = options.ollamaUrl
  if (!baseUrl) {
    const db = await getDb()
    const urlSetting = await db.query.settings.findFirst({
      where: eq(schema.settings.key, 'ollama_url'),
    })
    baseUrl = urlSetting?.value || 'http://localhost:11434'
  }

  let model = options.model
  if (!model) {
    const db = await getDb()
    const modelSetting = await db.query.settings.findFirst({
      where: eq(schema.settings.key, 'ai_model'),
    })
    model = modelSetting?.value || 'gemma:latest'
  }

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: options.signal,
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        num_predict: options.max_tokens || 2048,
        temperature: options.temperature || 0.7,
      },
    }),
  })

  const data = (await response.json()) as { response?: string }
  let responseText = data.response || ''

  if (options.think && responseText.includes('</think>')) {
    responseText = responseText.split('</think>').pop()?.trim() || responseText
  }

  return responseText
}

export async function fetchOllamaModels(baseUrl: string) {
  const response = await fetch(`${baseUrl}/api/tags`)
  if (!response.ok) throw new Error('Failed to fetch Ollama models')
  const data = (await response.json()) as { models?: OllamaModel[] }
  return data.models || []
}

export function parseAiJsonResponse<T>(
  response: string,
  parseItem: (item: unknown) => T | null,
  lineFallback: (line: string) => T | null,
): T[] {
  const clean = stripMarkdownCodeBlock(response)

  try {
    const json = JSON.parse(clean)
    if (Array.isArray(json)) {
      return json.map(parseItem).filter((t): t is T => t !== null)
    }
  } catch {
    // fallback to line parsing below
  }

  return clean
    .split('\n')
    .map((line) => line.replace(/^[-*•\d.\s]+/, '').trim())
    .filter((line) => line.length > 2)
    .map(lineFallback)
    .filter((t): t is T => t !== null)
}
