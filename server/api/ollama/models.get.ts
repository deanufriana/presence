export default defineEventHandler(async () => {
  try {
    const baseUrlSetting = await prisma.setting.findUnique({ where: { key: 'ollama_url' } })
    const baseUrl = baseUrlSetting?.value || 'http://localhost:11434'

    const response: any = await $fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    return {
      success: true,
      models: response.models || []
    }
  } catch (error: any) {
    console.error('Failed to fetch Ollama models:', error.message)
    return {
      success: false,
      models: [],
      error: error.message
    }
  }
})
