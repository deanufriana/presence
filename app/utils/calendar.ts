import { getCalendarEventsByMonth, getHolidaysByMonth, upsertHoliday } from '~/queries/calendar'

import type { CalendarEvent } from '~/types/calendar'

export async function getCalendarCache(month: string) {
  const events = await getCalendarEventsByMonth(month)
  return {
    events: (events as CalendarEvent[]) || [],
  }
}

export async function upsertCalendarCache(date: string, events: CalendarEvent[]) {
  const { deleteCalendarEventsByMonth, insertCalendarEvents } = await import('~/queries/calendar')
  await deleteCalendarEventsByMonth(date)

  if (events.length > 0) {
    await insertCalendarEvents(
      events.map((event) => ({
        date: event.date,
        summary: event.summary || '',
        startTime: event.startTime,
        endTime: event.endTime,
      })),
    )
  }
  return await getCalendarCache(date)
}

export async function fetchHolidays(year: string, month: number) {
  const monthStr = month.toString().padStart(2, '0')
  const datePrefix = `${year}-${monthStr}`

  const existing = await getHolidaysByMonth(datePrefix)
  if (existing && existing.length > 0) {
    return existing
  }

  const { fetch } = await import('@tauri-apps/plugin-http')
  try {
    const response = await fetch(
      `https://tanggalmerah.upset.dev/api/holidays?year=${year}&month=${month}`,
    )
    if (response.ok) {
      const result = (await response.json()) as {
        success: boolean
        data?: {
          date: string
          name: string
        }[]
      }
      if (result.success && Array.isArray(result.data)) {
        for (const h of result.data) {
          await upsertHoliday({
            holiday_date: h.date,
            holiday_name: h.name,
            is_holiday: true,
          })
        }
      }
    }
  } catch (err) {
    console.error('Failed to fetch holidays from API:', err)
  }

  return await getHolidaysByMonth(datePrefix)
}

export function formatCalendarActivity(ev: CalendarEvent): string {
  let act = ev.summary || ''
  if (ev.startTime && ev.endTime) {
    act = `Meeting from ${ev.startTime} to ${ev.endTime} with discuss about ${ev.summary}`
  } else if (ev.startTime) {
    act = `Meeting at ${ev.startTime} about ${ev.summary}`
  }
  return act
}
