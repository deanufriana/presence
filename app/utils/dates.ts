import { startOfMonth, endOfMonth, parse, format } from 'date-fns'

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
