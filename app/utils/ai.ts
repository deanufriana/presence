import { getDb, schema } from '~/db'
import type { OllamaModel } from '~/types/ollama'
import { eq } from 'drizzle-orm'
import { fetch } from '@tauri-apps/plugin-http'
import { stripMarkdownCodeBlock } from './format'

export interface AiOptions {
  signal?: AbortSignal
  max_tokens?: number
  temperature?: number
  provider?: string
  model?: string
  apiKey?: string
  ollamaUrl?: string
}

export function stripThinking(text: string): string {
  if (!text) return ''
  if (text.includes('</think>')) {
    return text.split('</think>').pop()?.trim() || text
  }
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
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

  let result = ''
  if (provider === 'gemini') {
    result = await generateGemini(prompt, options)
  } else if (provider === 'openai') {
    result = await generateOpenAi(prompt, options)
  } else if (provider === 'deepseek') {
    result = await generateDeepSeek(prompt, options)
  } else if (provider === 'ollama') {
    result = await generateOllama(prompt, options)
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`)
  }

  if (!result || !result.trim()) {
    throw new Error(
      `AI (${provider}) returned an empty response. Please check model name, balance, or quota.`,
    )
  }

  return result
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
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      }),
    },
  )

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    let message = `Gemini request failed (${response.status})`
    try {
      const errJson = JSON.parse(errText)
      if (errJson?.error?.message) message = errJson.error.message
    } catch {
      if (errText) message = errText
    }
    throw new Error(message)
  }

  const data = (await response.json()) as {
    candidates?: {
      content?: { parts?: { text?: string; thought?: boolean }[] }
    }[]
  }
  const parts = data.candidates?.[0]?.content?.parts || []
  const text = parts
    .filter((p) => !p.thought)
    .map((p) => p.text || '')
    .join('')
    .trim()

  return stripThinking(text)
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
      temperature: options.temperature || 0.7,
    }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    let message = `OpenAI request failed (${response.status})`
    try {
      const errJson = JSON.parse(errText)
      if (errJson?.error?.message) message = errJson.error.message
    } catch {
      if (errText) message = errText
    }
    throw new Error(message)
  }

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

  const isReasoner = model.includes('reasoner') || model.includes('r1')

  let lastError: unknown
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const payload: Record<string, unknown> = {
        model,
        messages: [{ role: 'user', content: prompt }],
        thinking: { type: 'disabled' },
        stream: false,
      }
      if (!isReasoner) {
        payload.temperature = options.temperature || 0.7
      }

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        signal: options.signal,
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errText = await response.text().catch(() => '')
        let message = `DeepSeek request failed (${response.status})`
        try {
          const errJson = JSON.parse(errText)
          if (errJson?.error?.message) message = errJson.error.message
        } catch {
          if (errText) message = errText
        }
        throw new Error(message)
      }

      const data = (await response.json()) as {
        choices?: {
          message?: { content?: string; reasoning_content?: string }
          finish_reason?: string
        }[]
      }

      const msg = data.choices?.[0]?.message
      let content = msg?.content?.trim() || ''

      // If content is empty (e.g. deepseek-reasoner spent all tokens on reasoning), fallback to reasoning_content
      if (!content && msg?.reasoning_content?.trim()) {
        content = msg.reasoning_content.trim()
      }

      return stripThinking(content)
    } catch (err: unknown) {
      lastError = err
      if (options.signal?.aborted) throw err
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1500))
      }
    }
  }

  throw lastError
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
        temperature: options.temperature || 0.7,
      },
    }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    let message = `Ollama request failed (${response.status})`
    try {
      const errJson = JSON.parse(errText)
      if (errJson?.error) message = errJson.error
    } catch {
      if (errText) message = errText
    }
    throw new Error(message)
  }

  const data = (await response.json()) as { response?: string; error?: string }
  if (data.error) {
    throw new Error(data.error)
  }

  let responseText = data.response || ''

  if (responseText.includes('</think>')) {
    responseText = responseText.split('</think>').pop()?.trim() || responseText
  }

  return stripThinking(responseText)
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
