export default defineEventHandler(async (event) => {
  const method = event.method

  if (method === 'GET') {
    const settings = await prisma.setting.findMany()
    return settings.reduce((acc: Record<string, string>, curr: { key: string, value: string }) => {
      acc[curr.key] = curr.value
      return acc
    }, {})
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const updates = []

    for (const [key, value] of Object.entries(body)) {
      updates.push(
        prisma.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    }

    await Promise.all(updates)
    return { success: true }
  }
})
