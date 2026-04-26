export interface CalendarEvent {
  date: string; // YYYY-MM-DD
  summary: string;
}

/**
 * Simple ICS parser to extract event summaries grouped by date.
 */
export function parseICS(content: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const veventBlocks = content.split('BEGIN:VEVENT');
  
  // Skip the header part before the first VEVENT
  for (let i = 1; i < veventBlocks.length; i++) {
    const block = veventBlocks[i];
    if (!block) continue;

    const summaryMatch = block.match(/SUMMARY:(.*)/);
    const dtstartMatch = block.match(/DTSTART(?:;[^:]*)?:(\d{8})/);

    if (summaryMatch && dtstartMatch) {
      const summary = summaryMatch[1]?.trim() || 'Meeting';
      const rawDate = dtstartMatch[1]; // YYYYMMDD
      
      if (rawDate && rawDate.length === 8) {
        const year = rawDate.substring(0, 4);
        const month = rawDate.substring(4, 6);
        const day = rawDate.substring(6, 8);
        const date = `${year}-${month}-${day}`;

        // Skip recurring rules for now as they are complex to parse without a library,
        // but most exported calendars for a specific period will have expanded instances
        // or at least the primary instance.
        
        // Filter out common unwanted summaries
        if (summary.toLowerCase().includes('canceled:') || summary.toLowerCase().includes('cancelled:')) {
          continue;
        }

        events.push({ date, summary });
      }
    }
  }

  return events;
}
