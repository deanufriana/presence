import { getDb, schema } from '~/db'
import type { OllamaModel } from '~/types/ollama'
import { eq } from 'drizzle-orm'
import { fetch } from '@tauri-apps/plugin-http'

export interface AiOptions {
  max_tokens?: number
  temperature?: number
  think?: boolean
}

export async function generateSummary(prompt: string, options: AiOptions = {}) {
  const db = await getDb()
  const providerSetting = await db.query.settings.findFirst({
    where: eq(schema.settings.key, 'ai_provider'),
  })
  const provider = providerSetting?.value || 'gemini'

  if (provider === 'gemini') {
    return await generateGemini(prompt, options)
  } else if (provider === 'openai') {
    return await generateOpenAi(prompt, options)
  } else if (provider === 'ollama') {
    return await generateOllama(prompt, options)
  }

  throw new Error(`Unsupported AI provider: ${provider}`)
}

async function generateGemini(prompt: string, options: AiOptions) {
  const db = await getDb()
  const apiKey = await db.query.settings.findFirst({
    where: eq(schema.settings.key, 'gemini_api_key'),
  })
  if (!apiKey?.value) throw new Error('Gemini API Key not set')

  const modelSetting = await db.query.settings.findFirst({
    where: eq(schema.settings.key, 'ai_model'),
  })
  const model = modelSetting?.value || 'gemini-2.0-flash'

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.value}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  const db = await getDb()
  const apiKey = await db.query.settings.findFirst({
    where: eq(schema.settings.key, 'openai_api_key'),
  })
  if (!apiKey?.value) throw new Error('OpenAI API Key not set')

  const modelSetting = await db.query.settings.findFirst({
    where: eq(schema.settings.key, 'ai_model'),
  })
  const model = modelSetting?.value || 'gpt-4o'

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.value}`,
    },
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
  const db = await getDb()
  const urlSetting = await db.query.settings.findFirst({
    where: eq(schema.settings.key, 'ollama_url'),
  })
  const modelSetting = await db.query.settings.findFirst({
    where: eq(schema.settings.key, 'ai_model'),
  })

  const baseUrl = urlSetting?.value || 'http://localhost:11434'
  const model = modelSetting?.value || 'gemma:latest'

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  const { fetch } = await import('@tauri-apps/plugin-http')
  const response = await fetch(`${baseUrl}/api/tags`)
  if (!response.ok) throw new Error('Failed to fetch Ollama models')
  const data = (await response.json()) as { models?: OllamaModel[] }
  return data.models || []
}
