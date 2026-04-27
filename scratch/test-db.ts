import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    const settings = await prisma.setting.findMany()
    console.log('Success! Found settings:', settings.length)
  } catch (e) {
    console.error('Failed to connect:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
