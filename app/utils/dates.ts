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
