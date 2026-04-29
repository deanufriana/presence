import { getYear, getMonth } from 'date-fns'
import type { Holiday } from '~/types/holiday'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const now = new Date()
  const year = parseInt(String(query.year || getYear(now)))
  const month = parseInt(String(query.month || getMonth(now) + 1))

  try {
    // 1. Check if we have holidays for this period in DB
    const datePrefix = `${year}-${String(month).padStart(2, '0')}`
    const cachedHolidays = await prisma.holiday.findMany({
      where: {
        date: {
          startsWith: datePrefix,
        },
        is_holiday: true,
      },
      orderBy: { date: 'asc' },
    })

    if (cachedHolidays.length > 0) {
      return cachedHolidays.map((h) => ({
        date: h.date,
        name: h.name,
        is_holiday: h.is_holiday,
        type: h.type || undefined,
      }))
    }

    // 2. Not in DB (or month has no holidays), fetch from API
    const url = new URL('https://tanggalmerah.upset.dev/api/holidays')
    url.searchParams.append('year', String(year))
    if (month) {
      url.searchParams.append('month', String(month))
    }

    const response = await $fetch<{ success: boolean; data: Holiday[] }>(url.toString())

    if (response.success) {
      // 3. Save to DB
      await prisma.$transaction(
        response.data.map((h) =>
          prisma.holiday.upsert({
            where: {
              date_name: {
                date: h.date,
                name: h.name,
              },
            },
            update: {
              is_holiday: h.is_holiday ?? true,
              type: h.type,
            },
            create: {
              date: h.date,
              name: h.name,
              is_holiday: h.is_holiday ?? true,
              type: h.type,
            },
          }),
        ),
      )

      return response.data
    }

    return []
  } catch (error) {
    console.error('Failed to fetch/cache holidays:', error)
    return []
  }
})
