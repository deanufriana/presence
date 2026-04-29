export default defineEventHandler(async () => {
  const settings = await prisma.setting.findMany()
  return settings.reduce((acc: Record<string, string>, curr: { key: string; value: string }) => {
    acc[curr.key] = curr.value
    return acc
  }, {})
})
