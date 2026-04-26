export default defineEventHandler(async (event) => {
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
})
