import { format, isWeekend, getDaysInMonth, setDate, differenceInCalendarDays } from 'date-fns'
import type { ReportRow } from '~/types/report'

export interface ActivityMoveProposal {
  id: string
  sourceDate: string
  targetDate: string
  distanceDays: number // e.g. -2, -1, +1, +2
  activityText: string
  selected: boolean
}

export interface BalanceOptions {
  maxDistanceDays?: number // default 2
  targetPerDay?: number // default 2
  minKeepDonor?: number // default 1
}

export interface BalanceResult {
  proposals: ActivityMoveProposal[]
  stats: {
    totalMoves: number
    resolvedEmptyDays: number
    donorDaysCount: number
    recipientDaysCount: number
  }
}

/**
 * Checks whether an activity appears to be an anchored event (like a scheduled meeting)
 * that should not be shifted between days if other tasks are available.
 */
function isAnchoredActivity(text: string): boolean {
  return /(\bmeeting\b|\bstandup\b|\bsync\b|\bplanning\b|\bretro\b|\b1on1\b|\b1-1\b|\bbriefing\b)/i.test(
    text,
  )
}

/**
 * Computes suggested activity moves to balance daily reports across workdays,
 * strictly enforcing a maximum distance of +/- maxDistanceDays (default 2 days).
 */
export function computeBalancedMoves(
  monthStr: string,
  dailyRows: ReportRow[],
  isHoliday: (date: string) => boolean,
  options: BalanceOptions = {},
): BalanceResult {
  const maxDistanceDays = options.maxDistanceDays ?? 2
  const targetPerDay = options.targetPerDay ?? 3
  const minKeepDonor = options.minKeepDonor ?? 1

  const [yearStr, monthNumStr] = monthStr.split('-')
  const year = parseInt(yearStr || '0', 10)
  const monthIdx = parseInt(monthNumStr || '0', 10) - 1
  const baseDate = new Date(year, monthIdx, 1)
  const totalDays = getDaysInMonth(baseDate)

  interface DayState {
    date: string
    dateObj: Date
    isEligible: boolean
    activities: string[]
    initialCount: number
  }

  const days: DayState[] = []

  for (let d = 1; d <= totalDays; d++) {
    const dateObj = setDate(baseDate, d)
    const dateStr = format(dateObj, 'yyyy-MM-dd')
    const existingRow = dailyRows.find((r) => r.date === dateStr)

    const isWeekendDay = isWeekend(dateObj)
    const isHolidayDay = isHoliday(dateStr)
    const hasAttendance = !!(existingRow?.masuk || existingRow?.pulang)

    // A recipient day must be a workday or have logged attendance
    const isEligible = (!isWeekendDay && !isHolidayDay) || hasAttendance

    const rawActivities = (existingRow?.aktivitas || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    days.push({
      date: dateStr,
      dateObj,
      isEligible,
      activities: [...rawActivities],
      initialCount: rawActivities.length,
    })
  }

  const proposals: ActivityMoveProposal[] = []

  // Run balancing passes progressively from 1 up to targetPerDay:
  // Pass 1: Focus on completely empty workdays (0 activities)
  // Pass 2..N: Bring workdays progressively up to targetPerDay
  const passes: number[] = []
  for (let p = 1; p <= targetPerDay; p++) {
    passes.push(p)
  }

  for (const passTarget of passes) {
    const recipientDays = days.filter((day) => day.isEligible && day.activities.length < passTarget)

    for (const recipient of recipientDays) {
      while (recipient.activities.length < passTarget) {
        // Find donor days within maxDistanceDays that have surplus activities
        const candidateDonors = days
          .filter((day) => {
            if (day.date === recipient.date) return false
            if (day.activities.length <= minKeepDonor) return false
            // Donor must have strictly more activities than recipient would have after receiving
            if (day.activities.length <= recipient.activities.length + 1) return false

            const diff = Math.abs(differenceInCalendarDays(day.dateObj, recipient.dateObj))
            return diff > 0 && diff <= maxDistanceDays
          })
          .sort((a, b) => {
            const distA = Math.abs(differenceInCalendarDays(a.dateObj, recipient.dateObj))
            const distB = Math.abs(differenceInCalendarDays(b.dateObj, recipient.dateObj))
            // Prioritize closer days (+/- 1 day) first
            if (distA !== distB) return distA - distB
            // Then prioritize donors with higher surplus
            return b.activities.length - a.activities.length
          })

        if (candidateDonors.length === 0) break

        const donor = candidateDonors[0]
        if (!donor) break

        // Pick activity from donor: prefer non-anchor activity first
        let pickIdx = donor.activities.findIndex((act) => !isAnchoredActivity(act))
        if (pickIdx === -1) {
          // If all are anchored, pick the last one
          pickIdx = donor.activities.length - 1
        }

        const [movedActivity] = donor.activities.splice(pickIdx, 1)
        if (!movedActivity) break

        recipient.activities.push(movedActivity)

        const dist = differenceInCalendarDays(recipient.dateObj, donor.dateObj)

        proposals.push({
          id: `move-${donor.date}-${recipient.date}-${proposals.length}`,
          sourceDate: donor.date,
          targetDate: recipient.date,
          distanceDays: dist,
          activityText: movedActivity,
          selected: true,
        })
      }
    }
  }

  // Calculate statistics
  const emptyDaysBefore = days.filter((d) => d.isEligible && d.initialCount === 0).length
  const emptyDaysAfter = days.filter((d) => d.isEligible && d.activities.length === 0).length
  const resolvedEmptyDays = Math.max(0, emptyDaysBefore - emptyDaysAfter)

  const donorDates = new Set(proposals.map((p) => p.sourceDate))
  const recipientDates = new Set(proposals.map((p) => p.targetDate))

  return {
    proposals,
    stats: {
      totalMoves: proposals.length,
      resolvedEmptyDays,
      donorDaysCount: donorDates.size,
      recipientDaysCount: recipientDates.size,
    },
  }
}
