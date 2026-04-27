export default defineEventHandler(async () => {
  console.log('Current DATABASE_URL:', process.env.DATABASE_URL)
  const settings = await prisma.setting.findMany()
  return settings.reduce((acc: Record<string, string>, curr: { key: string, value: string }) => {
    acc[curr.key] = curr.value
    return acc
  }, {})
})
