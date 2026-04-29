import { defineStore } from 'pinia'
import { parse, startOfMonth, getDaysInMonth, getDay, format } from 'date-fns'
import { useToast } from '~/composables/use-toast'
import { parseICS } from '~/utils/ics'
import { useCoreStore } from '~/stores/core'
import { useGitlabStore } from '~/stores/gitlab'
import { useDailyStore } from '~/stores/daily'
import { useJiraStore } from '~/stores/jira'
import type { CalendarCache, Holiday, GitLabEvent, CalendarEvent, JiraEvent } from '~/types/report'

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

    for (let i = 1; i <= count; i++) {
      const dayDate = format(new Date(d.getFullYear(), d.getMonth(), i), 'yyyy-MM-dd')

      const dayGitlabEvents = gitlabEvents.filter((ev: GitLabEvent) => {
        if (!ev.created_at) return false
        return ev.created_at.startsWith(dayDate)
      })

      const dayCalendarEvents = calEvents.filter((ev: CalendarEvent) => ev.date === dayDate)

      const dayJiraEvents = jiraEvents.filter((ev: JiraEvent) => {
        if (!ev.updated_at) return false
        return ev.updated_at.startsWith(dayDate)
      })

      const dayHoliday = holidays.value.find((h: Holiday) => h.date === dayDate)

      days.push({
        dayNum: i,
        date: dayDate,
        isToday: dayDate === format(new Date(), 'yyyy-MM-dd'),
        count: dayGitlabEvents.length,
        commits: dayGitlabEvents,
        calendarEvents: dayCalendarEvents,
        jiraEvents: dayJiraEvents,
        jiraCount: dayJiraEvents.length,
        hasManual: !!dailyStore.manualActivitiesMap[dayDate],
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

      await $fetch('/api/calendar/cache', {
        method: 'POST',
        body: { date: core.selectedDate, events },
      })
      calendarData.value = { success: true, events, date: core.selectedDate, cached: true }

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
      const data = await $fetch<CalendarCache>('/api/calendar/cache', {
        query: { date: core.selectedDate },
      })
      calendarData.value = data
    } catch (err) {
      console.error('Failed to fetch calendar events:', err)
    }
  }

  const fetchHolidays = async () => {
    if (!core.selectedDate) return
    fetchingHolidays.value = true
    try {
      const [year, month] = core.selectedDate.split('-')
      if (!month) {
        return
      }
      const data = await $fetch<Holiday[]>('/api/holidays', {
        query: { year, month: parseInt(month) },
      })
      holidays.value = Array.isArray(data) ? data : []
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
