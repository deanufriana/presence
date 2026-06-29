import { defineStore } from 'pinia'
import { parse, startOfMonth, getDaysInMonth, getDay, format } from 'date-fns'
import { useToast } from '~/composables/use-toast'
import { parseICS } from '~/utils/ics'
import { useCoreStore } from '~/stores/core'
import { useGitlabStore } from '~/stores/gitlab'
import { useDailyStore } from '~/stores/daily'
import { useJiraStore } from '~/stores/jira'
import type { CalendarCache, CalendarEvent } from '~/types/calendar'
import type { Holiday } from '~/types/holiday'
import type { GitLabEvent } from '~/types/gitlab'
import type { JiraEvent } from '~/types/jira'

export const useCalendarStore = defineStore('calendar', () => {
  const core = useCoreStore()
  const { success, error, loading } = useToast()

  const calendarData = ref<CalendarCache | null>(null)
  const holidays = ref<Holiday[]>([])
  const importingCalendar = ref(false)
  const fetchingHolidays = ref(false)

  const calendarBlanks = computed(() => {
    const d = parse(core.selectedDate, 'yyyy-MM', new Date())
    return getDay(startOfMonth(d))
  })

  const calendarDays = computed(() => {
    const d = parse(core.selectedDate, 'yyyy-MM', new Date())
    const count = getDaysInMonth(d)
    const days = []

    const gitlabStore = useGitlabStore()
    const dailyStore = useDailyStore()
    const jiraStore = useJiraStore()

    const gitlabEvents = Array.isArray(gitlabStore.gitlabData?.events)
      ? gitlabStore.gitlabData.events
      : []
    const calEvents = Array.isArray(calendarData.value?.events) ? calendarData.value.events : []
    const jiraEvents = Array.isArray(jiraStore.jiraData?.events) ? jiraStore.jiraData.events : []

    // Pre-group events by date for O(N + M) efficiency
    const gitlabByDate: Record<string, GitLabEvent[]> = {}
    gitlabEvents.forEach((ev) => {
      const date = ev.created_at?.split('T')[0]
      if (date) {
        if (!gitlabByDate[date]) gitlabByDate[date] = []
        gitlabByDate[date].push(ev)
      }
    })

    const calByDate: Record<string, CalendarEvent[]> = {}
    calEvents.forEach((ev) => {
      const date = ev.date
      if (date) {
        if (!calByDate[date]) calByDate[date] = []
        calByDate[date].push(ev)
      }
    })

    const jiraByDate: Record<string, JiraEvent[]> = {}
    jiraEvents.forEach((ev) => {
      const date = ev.updated_at?.split('T')[0]
      if (date) {
        if (!jiraByDate[date]) jiraByDate[date] = []
        jiraByDate[date].push(ev)
      }
    })

    const holidayByDate: Record<string, Holiday> = {}
    holidays.value.forEach((h) => {
      if (h.date) {
        holidayByDate[h.date] = h
      }
    })

    const dailyByDate: Record<string, boolean> = {}
    dailyStore.dailyTable.forEach((row) => {
      if (row.aktivitas) {
        dailyByDate[row.date] = true
      }
    })

    for (let i = 1; i <= count; i++) {
      const dayDate = format(new Date(d.getFullYear(), d.getMonth(), i), 'yyyy-MM-dd')

      const dayGitlabEvents = gitlabByDate[dayDate] || []
      const dayCalendarEvents = calByDate[dayDate] || []
      const dayJiraEvents = jiraByDate[dayDate] || []
      const dayHoliday = holidayByDate[dayDate]

      days.push({
        dayNum: i,
        date: dayDate,
        isToday: dayDate === format(new Date(), 'yyyy-MM-dd'),
        count: dayGitlabEvents.length,
        commits: dayGitlabEvents,
        calendarEvents: dayCalendarEvents,
        jiraEvents: dayJiraEvents,
        jiraCount: dayJiraEvents.length,
        hasManual: !!dailyByDate[dayDate],
        holiday: dayHoliday,
        isHoliday: !!dayHoliday,
      })
    }
    return days
  })

  const importCalendar = async (file: File) => {
    importingCalendar.value = true
    const loadingToastId = loading('Importing calendar events...')
    try {
      const content = await file.text()
      const events = parseICS(content)
      if (events.length === 0) {
        error('No events found in the calendar file.', { id: loadingToastId })
        return
      }

      const { upsertCalendarCache } = await import('~/utils/calendar')
      const data = await upsertCalendarCache(core.selectedDate, events)
      calendarData.value = data as CalendarCache

      success(`Successfully imported ${events.length} events!`, { id: loadingToastId })
    } catch (err) {
      console.error('Failed to import calendar:', err)
      error('Failed to import calendar file', { id: loadingToastId })
    } finally {
      importingCalendar.value = false
    }
  }

  const fetchCalendarEvents = async () => {
    try {
      const { getCalendarCache } = await import('~/utils/calendar')
      const data = await getCalendarCache(core.selectedDate)
      calendarData.value = data as CalendarCache
    } catch (err) {
      console.error('Failed to fetch calendar events:', err)
    }
  }

  const fetchHolidays = async () => {
    if (!core.selectedDate) return
    fetchingHolidays.value = true
    try {
      const [year, month] = core.selectedDate.split('-')
      if (!year || !month) return

      const { fetchHolidays: fetchHolidaysUtil } = await import('~/utils/calendar')
      const data = await fetchHolidaysUtil(year, parseInt(month))
      holidays.value = (data as Holiday[]) || []
    } catch (err) {
      console.error('Failed to fetch holidays:', err)
    } finally {
      fetchingHolidays.value = false
    }
  }

  const isHoliday = (date: string) => {
    return holidays.value.some((h: Holiday) => h.date === date)
  }

  const getHolidayName = (date: string) => {
    const holiday = holidays.value.find((h: Holiday) => h.date === date)
    return holiday ? holiday.name : ''
  }

  // Watch for date changes to refetch holidays
  watch(
    () => core.selectedDate,
    () => {
      fetchHolidays()
    },
    { immediate: true },
  )

  return {
    calendarData,
    holidays,
    importingCalendar,
    fetchingHolidays,
    calendarBlanks,
    calendarDays,
    getHolidayName,
    fetchCalendarEvents,
    isHoliday,
    importCalendar,
    fetchHolidays,
  }
})
