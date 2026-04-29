import type { OllamaModelsResponse } from '~/types/ollama'

export default defineEventHandler(async () => {
  try {
    const baseUrlSetting = await prisma.setting.findUnique({ where: { key: 'ollama_url' } })
    const baseUrl = baseUrlSetting?.value || 'http://localhost:11434'

    const response = await $fetch<OllamaModelsResponse>(`${baseUrl}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    return {
      success: true,
      models: response.models || [],
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Failed to fetch Ollama models:', msg)
    return {
      success: false,
      models: [],
      error: msg,
    }
  }
})
