<template>
  <Card class="overflow-hidden border-indigo-500/10 shadow-lg shadow-indigo-500/5 mb-6">
    <CardHeader class="border-b border-border/40 bg-muted/10 py-3">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <CardTitle class="flex items-center gap-2 text-base shrink-0">
          <div class="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500/10">
            <LayoutGrid class="h-4 w-4 text-indigo-500" />
          </div>
          <span>Activity Overview</span>
        </CardTitle>

        <div class="flex flex-wrap items-center gap-3 sm:gap-4">
          <!-- View Mode Toggle -->
          <div
            class="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/40 shadow-inner"
          >
            <Button
              size="xxs"
              variant="ghost"
              class="h-6 px-3 text-[10px] font-bold rounded-md transition-all"
              :class="
                viewMode === 'monthly'
                  ? 'bg-background shadow-sm text-indigo-600 dark:text-indigo-400'
                  : 'text-muted-foreground hover:text-foreground'
              "
              @click="viewMode = 'monthly'"
            >
              MONTHLY
            </Button>
            <Button
              size="xxs"
              variant="ghost"
              class="h-6 px-3 text-[10px] font-bold rounded-md transition-all"
              :class="
                viewMode === 'yearly'
                  ? 'bg-background shadow-sm text-indigo-600 dark:text-indigo-400'
                  : 'text-muted-foreground hover:text-foreground'
              "
              @click="viewMode = 'yearly'"
            >
              YEARLY
            </Button>
          </div>

          <!-- Year Navigation -->
          <div class="flex items-center gap-1 bg-muted/20 rounded-md p-0.5 border border-border/40">
            <Button
              variant="ghost"
              size="icon"
              class="h-6 w-6 hover:bg-background rounded"
              @click="coreStore.prevYear"
            >
              <ChevronLeft class="h-3.5 w-3.5" />
            </Button>
            <span class="text-[10px] font-bold w-10 text-center text-muted-foreground">{{
              currentYear
            }}</span>
            <Button
              variant="ghost"
              size="icon"
              class="h-6 w-6 hover:bg-background rounded"
              :disabled="isNextYearDisabled"
              @click="coreStore.nextYear"
            >
              <ChevronRight class="h-3.5 w-3.5" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="xxs"
            :disabled="fetchingActivities"
            class="h-7 gap-1.5 px-2 text-[10px] border-indigo-500/20 hover:border-indigo-500/40 hover:bg-indigo-500/5 text-indigo-600 dark:text-indigo-400"
            @click="fetchYearlyActivities"
          >
            <RefreshCw class="h-3 w-3" :class="{ 'animate-spin': fetchingActivities }" />
            <span class="hidden xs:inline">Sync</span>
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent class="p-6">
      <div
        v-if="fetchingActivities"
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
      >
        <div v-for="i in 12" :key="i" class="h-20 bg-muted/40 animate-pulse rounded-xl" />
      </div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div
          v-for="month in yearlyActivities"
          :key="month.month"
          class="relative h-20 rounded-xl border border-border/40 flex flex-col items-center justify-center group transition-all cursor-pointer hover:shadow-xl hover:scale-[1.02] active:scale-95"
          :class="[
            getMonthContainerClasses(month),
            isSelected(month.month)
              ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-950 border-transparent'
              : '',
          ]"
          @click="selectMonth(month.month)"
        >
          <!-- Month Label -->
          <span
            class="text-[11px] font-bold uppercase tracking-widest mb-3 group-hover:scale-110 transition-transform"
            :class="getMonthTextClasses(month)"
          >
            {{ formatMonth(month.month) }}
          </span>

          <!-- Activity Indicators (Large Dots) -->
          <div class="flex gap-2">
            <div
              class="h-2.5 w-2.5 rounded-full shadow-sm transition-all duration-300"
              :class="
                month.hasGitlab
                  ? 'bg-orange-500 scale-110 shadow-orange-500/50'
                  : 'bg-muted/20 scale-100'
              "
              title="GitLab"
            />
            <div
              class="h-2.5 w-2.5 rounded-full shadow-sm transition-all duration-300"
              :class="
                month.hasJira ? 'bg-blue-600 scale-110 shadow-blue-600/50' : 'bg-muted/20 scale-100'
              "
              title="Jira"
            />
            <div
              class="h-2.5 w-2.5 rounded-full shadow-sm transition-all duration-300"
              :class="
                month.hasCalendar
                  ? 'bg-violet-500 scale-110 shadow-violet-500/50'
                  : 'bg-muted/20 scale-100'
              "
              title="Calendar"
            />
            <div
              class="h-2.5 w-2.5 rounded-full shadow-sm transition-all duration-300"
              :class="
                month.hasDaily
                  ? 'bg-emerald-500 scale-110 shadow-emerald-500/50'
                  : 'bg-muted/20 scale-100'
              "
              title="Daily Report"
            />
          </div>

          <!-- Status Badge -->
          <div v-if="month.hasActivity" class="absolute top-2 right-2">
            <div
              class="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.6)]"
            />
          </div>

          <!-- Interaction Prompt -->
          <div
            class="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/[0.02] rounded-xl transition-colors"
          />
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { LayoutGrid, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { useYearlyStore } from '~/stores/yearly'
import { useCoreStore } from '~/stores/core'
import { storeToRefs } from 'pinia'
import { format, parse, getYear } from 'date-fns'
import type { YearlyActivityMonth } from '~/types/report'
import { id as idLocale } from 'date-fns/locale'

const yearlyStore = useYearlyStore()
const coreStore = useCoreStore()

const { fetchYearlyActivities } = yearlyStore
const { yearlyActivities, fetchingActivities, currentYear } = storeToRefs(yearlyStore)
const { selectedDate, viewMode } = storeToRefs(coreStore)

const isNextYearDisabled = computed(() => {
  return parseInt(currentYear.value || '2025') >= getYear(new Date())
})

const formatMonth = (monthStr: string) => {
  try {
    const d = parse(monthStr, 'yyyy-MM', new Date())
    return format(d, 'MMMM', { locale: idLocale })
  } catch {
    return monthStr
  }
}

const selectMonth = (monthStr: string) => {
  coreStore.selectedDate = monthStr
}

const isSelected = (monthStr: string) => {
  return selectedDate.value === monthStr
}

const getMonthContainerClasses = (month: YearlyActivityMonth) => {
  if (!month.hasActivity) return 'bg-muted/5 border-border/40'

  // Highlight based on primary activity (priority: gitlab > jira > cal > daily)
  if (month.hasGitlab) return 'bg-orange-500/[0.03] border-orange-500/20 hover:border-orange-500/40'
  if (month.hasJira) return 'bg-blue-600/[0.03] border-blue-600/20 hover:border-blue-600/40'
  if (month.hasCalendar)
    return 'bg-violet-500/[0.03] border-violet-500/20 hover:border-violet-500/40'
  if (month.hasDaily)
    return 'bg-emerald-500/[0.03] border-emerald-500/20 hover:border-emerald-500/40'

  return 'bg-indigo-500/[0.03] border-indigo-500/20 hover:border-indigo-500/40'
}

const getMonthTextClasses = (month: YearlyActivityMonth) => {
  if (isSelected(month.month)) return 'text-indigo-600 dark:text-indigo-400'
  if (!month.hasActivity) return 'text-muted-foreground/60'

  if (month.hasGitlab)
    return 'text-orange-600/80 dark:text-orange-400/80 group-hover:text-orange-600 dark:group-hover:text-orange-400'
  if (month.hasJira)
    return 'text-blue-600/80 dark:text-blue-400/80 group-hover:text-blue-600 dark:group-hover:text-blue-400'
  if (month.hasCalendar)
    return 'text-violet-600/80 dark:text-violet-400/80 group-hover:text-violet-600 dark:group-hover:text-violet-400'
  if (month.hasDaily)
    return 'text-emerald-600/80 dark:text-emerald-400/80 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'

  return 'text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
}

watch(
  currentYear,
  () => {
    fetchYearlyActivities()
  },
  { immediate: true },
)
</script>
