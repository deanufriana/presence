import { defineStore } from 'pinia'
import { parse, startOfMonth, getDaysInMonth, getDay, format } from "date-fns"
import { useToast } from "~/composables/use-toast"
import { parseICS } from "~/utils/ics"
import { useCoreStore } from '~/stores/core'
import { useGitlabStore } from '~/stores/gitlab'
import { useDailyStore } from '~/stores/daily'
import type { ReportRow } from '~/types/report'

export const useCalendarStore = defineStore('calendar', () => {
  const core = useCoreStore()
  const { success, error, loading } = useToast()

  const calendarData = ref<any>(null)
  const importingCalendar = ref(false)

  function setCache (cachedCalendar: any) {
    calendarData.value = cachedCalendar
  }

  const calendarBlanks = computed(() => {
    const d = parse(core.selectedDate, "yyyy-MM", new Date())
    return getDay(startOfMonth(d))
  })

  const calendarDays = computed(() => {
    const d = parse(core.selectedDate, "yyyy-MM", new Date())
    const count = getDaysInMonth(d)
    const days = []

    const gitlabStore = useGitlabStore()
    const dailyStore = useDailyStore()

    const gitlabEvents = Array.isArray(gitlabStore.gitlabData?.events) ? gitlabStore.gitlabData.events : []
    const calEvents = Array.isArray(calendarData.value?.events) ? calendarData.value.events : []

    for (let i = 1; i <= count; i++) {
      const dayDate = format(new Date(d.getFullYear(), d.getMonth(), i), "yyyy-MM-dd")

      const dayGitlabEvents = gitlabEvents.filter((ev: any) => {
        if (!ev.created_at) return false
        return ev.created_at.startsWith(dayDate)
      })

      const dayCalendarEvents = calEvents.filter((ev: any) => ev.date === dayDate)

      days.push({
        dayNum: i,
        date: dayDate,
        isToday: dayDate === format(new Date(), "yyyy-MM-dd"),
        count: dayGitlabEvents.length,
        commits: dayGitlabEvents,
        calendarEvents: dayCalendarEvents,
        hasManual: !!dailyStore.manualActivitiesMap[dayDate],
      })
    }
    return days
  })

  const importCalendar = async (file: File) => {
    importingCalendar.value = true
    const loadingToastId = loading("Importing calendar events...")
    try {
      const content = await file.text()
      const events = parseICS(content)
      if (events.length === 0) {
        error("No events found in the calendar file.", { id: loadingToastId })
        return
      }

      const groupedEvents: Record<string, string[]> = {}
      events.forEach((ev) => {
        let group = groupedEvents[ev.date]
        if (!group) { group = []; groupedEvents[ev.date] = group; }
        
        let act = ev.summary
        if (ev.startTime && ev.endTime) {
          act = `Meeting from ${ev.startTime} to ${ev.endTime} with discuss about ${ev.summary}`
        } else if (ev.startTime) {
          act = `Meeting at ${ev.startTime} with discuss about ${ev.summary}`
        }

        if (!group.includes(act)) group.push(act)
      })

      const dailyStore = useDailyStore()
      const updates: ReportRow[] = []
      const currentRows = [...dailyStore.localRows]

      Object.entries(groupedEvents).forEach(([date, newActs]) => {
        const existingRowIndex = currentRows.findIndex((r) => r.date === date)
        let updatedAktivitas = ""
        if (existingRowIndex !== -1) {
          const row = currentRows[existingRowIndex]
          if (!row) return
          const existingActs = (row.aktivitas || "").split(";").map((s) => s.trim()).filter(Boolean)
          newActs.forEach((act) => {
            if (!existingActs.some((ea) => ea.toLowerCase() === act.toLowerCase())) existingActs.push(act)
          })
          updatedAktivitas = existingActs.join("; ")
          row.aktivitas = updatedAktivitas
          updates.push(row)
        } else {
          updatedAktivitas = newActs.join("; ")
          const newRow: ReportRow = { date, masuk: "", pulang: "", ti: "", aktivitas: updatedAktivitas }
          currentRows.push(newRow)
          updates.push(newRow)
        }
        dailyStore.manualActivitiesMap[date] = updatedAktivitas
      })

      if (updates.length > 0) {
        currentRows.sort((a, b) => a.date.localeCompare(b.date))
        dailyStore.localRows = currentRows
        await Promise.all([
          $fetch("/api/report/daily" as any, { method: "POST", body: updates }),
          $fetch("/api/calendar/cache" as any, { method: "POST", body: { date: core.selectedDate, events } }),
        ])
        calendarData.value = { success: true, events, date: core.selectedDate, cached: true }
      }
      success(`Successfully imported ${events.length} events!`, { id: loadingToastId })
    } catch (err) {
      console.error("Failed to import calendar:", err)
      error("Failed to import calendar file", { id: loadingToastId })
    } finally {
      importingCalendar.value = false
    }
  }

  return {
    calendarData,
    importingCalendar,
    calendarBlanks,
    calendarDays,
    setCache,
    importCalendar,
  }
})
