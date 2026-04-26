import { prisma } from './prisma'

export interface AiOptions {
  model?: string;
  max_tokens?: number;
}

export const generateSummary = async (prompt: string, options: AiOptions): Promise<string> => {
  try {
    return await callGemini(prompt, options)
  } catch (geminiError: any) {
    console.error('Gemini failed:', geminiError.message)

    // Only fallback to OpenAI if a key is provided
    const openAiKey = await prisma.setting.findUnique({ where: { key: 'openai_api_key' } })
    if (openAiKey?.value) {
      return await callOpenAi(prompt, options)
    }

    throw geminiError
  }
}

async function callOpenAi (prompt: string, options: AiOptions): Promise<string> {
  const aiKeySetting = await prisma.setting.findUnique({ where: { key: 'openai_api_key' } })
  if (!aiKeySetting?.value) throw new Error('AI API Key not configured in settings')

  const isJson = prompt.toLowerCase().includes('json')
  const response: any = await (globalThis as any).$fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${aiKeySetting.value}`,
      'Content-Type': 'application/json'
    },
    body: {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Anda adalah asisten profesional yang membantu merangkum aktivitas kerja.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: options.max_tokens,
      response_format: isJson ? { type: "json_object" } : undefined
    }
  })

  const content = response?.choices?.[0]?.message?.content?.trim()
  if (!content) throw new Error('OpenAI did not return a valid summary')

  return content.replace(/^["']|["']$/g, '')
}

async function callGemini (prompt: string, options: AiOptions): Promise<string> {
  const aiKeySetting = await prisma.setting.findUnique({ where: { key: 'ai_api_key' } })
  if (!aiKeySetting) throw new Error('AI API Key not configured in settings')

  const url: any = `https://generativelanguage.googleapis.com/v1/models/${options.model ?? 'gemini-2.5-flash-lite'}:generateContent?key=${aiKeySetting.value}`
  const response: any = await (globalThis as any).$fetch(url, {
    method: 'POST',
    body: {
      contents: [{
        parts: [{ text: prompt }]
      }]
    }
  })

  const content = response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  if (!content) throw new Error('Gemini did not return a valid summary')

  return content.replace(/^["']|["']$/g, '')
}
