import type { CalendarEvent } from '~/types/calendar'

/**
 * Simple ICS parser to extract event summaries grouped by date.
 */
export function parseICS(content: string): CalendarEvent[] {
  const events: CalendarEvent[] = []
  const veventBlocks = content.split('BEGIN:VEVENT')

  // Skip the header part before the first VEVENT
  for (let i = 1; i < veventBlocks.length; i++) {
    const block = veventBlocks[i]
    if (!block) continue

    const summaryMatch = block.match(/SUMMARY:(.*)/)
    const dtstartMatch = block.match(/DTSTART(?:;[^:]*)?:(\d{8})T(\d{4})/)
    const dtendMatch = block.match(/DTEND(?:;[^:]*)?:(\d{8})T(\d{4})/)

    if (summaryMatch && dtstartMatch) {
      const summary = summaryMatch[1]?.trim() || 'Meeting'
      const rawDate = dtstartMatch[1] // YYYYMMDD
      const rawStartTime = dtstartMatch[2] // HHmm

      if (rawDate && rawDate.length === 8) {
        const year = rawDate.substring(0, 4)
        const month = rawDate.substring(4, 6)
        const day = rawDate.substring(6, 8)
        const date = `${year}-${month}-${day}`

        let startTime = ''
        if (rawStartTime) {
          startTime = `${rawStartTime.substring(0, 2)}:${rawStartTime.substring(2, 4)}`
        }

        let endTime = ''
        if (dtendMatch && dtendMatch[2]) {
          const rawEndTime = dtendMatch[2]
          endTime = `${rawEndTime.substring(0, 2)}:${rawEndTime.substring(2, 4)}`
        }

        // Skip recurring rules for now as they are complex to parse without a library,
        // but most exported calendars for a specific period will have expanded instances
        // or at least the primary instance.

        // Filter out common unwanted summaries
        if (
          summary.toLowerCase().includes('canceled:') ||
          summary.toLowerCase().includes('cancelled:')
        ) {
          continue
        }

        events.push({ date, summary, startTime, endTime })
      }
    }
  }

  return events
}
