export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { date, name, is_holiday, type } = body

  if (!date || !name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Date and Name are required',
    })
  }

  try {
    const holiday = await prisma.holiday.upsert({
      where: {
        date_name: {
          date,
          name,
        },
      },
      update: {
        is_holiday: is_holiday ?? true,
        type: type || 'manual',
      },
      create: {
        date,
        name,
        is_holiday: is_holiday ?? true,
        type: type || 'manual',
      },
    })

    return { success: true, data: holiday }
  } catch (error) {
    console.error('Failed to add holiday:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to add holiday',
    })
  }
})
