import { startOfMonth, endOfMonth, parse, format, getDaysInMonth, isWeekend } from 'date-fns'

export function getMonthRange(dateStr: string) {
  const baseDate = parse(dateStr, 'yyyy-MM', new Date())
  const firstDay = startOfMonth(baseDate)
  const lastDay = endOfMonth(baseDate)
  return {
    firstDay,
    lastDay,
    firstDayStr: format(firstDay, 'yyyy-MM-dd'),
    lastDayStr: format(lastDay, 'yyyy-MM-dd'),
  }
}

/**
 * Canonical local-time day key (`yyyy-MM-dd`) for a date-ish value.
 *
 * Every activity source is bucketed into days by this key, so every site must
 * agree on it. Two traps this avoids:
 *  - `iso.split('T')[0]` returns the UTC date, which files a late-evening local
 *    event under the previous day (and can drop it out of the month entirely,
 *    since DB range filters use local month boundaries).
 *  - `new Date('2026-09-01')` parses as midnight *UTC*, so re-formatting a bare
 *    day string shifts it a day backwards in any timezone west of UTC.
 */
export function toDateKey(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined || value === '') return ''

  // Already a plain local day key (e.g. CalendarEvent.date): pass through.
  // Must be anchored to the WHOLE string - a prefix match would also swallow
  // full timestamps and hand back their UTC date instead of the local one.
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return format(date, 'yyyy-MM-dd')
}

export function getWorkingDaysInMonth(dateStr: string, holidays: { date: string }[] = []) {
  let parsedDate = parse(dateStr, 'yyyy-MM', new Date())
  if (isNaN(parsedDate.getTime())) {
    parsedDate = new Date()
  }
  const year = parsedDate.getFullYear()
  const month = parsedDate.getMonth()
  const daysCount = getDaysInMonth(new Date(year, month))

  let count = 0
  for (let day = 1; day <= daysCount; day++) {
    const date = new Date(year, month, day)
    const formattedDate = format(date, 'yyyy-MM-dd')
    const isWeekendDay = isWeekend(date)
    const isHoliday = holidays.some((h) => h.date === formattedDate)

    if (!isWeekendDay && !isHoliday) {
      count++
    }
  }
  return count > 0 ? count : 20
}
