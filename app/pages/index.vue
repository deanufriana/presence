<template>
  <div class="flex flex-col gap-4 max-w-5xl mx-auto">
    <!-- Page Header -->
    <div class="flex flex-col gap-1">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p class="text-sm text-muted-foreground mt-1">
            Generate your daily activity report from GitLab, Jira, and Calendar activity.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <!-- Settings Button -->
          <Button variant="outline" size="sm" class="gap-2" @click="showSettings = true">
            <Settings class="h-4 w-4" />
            <span class="hidden sm:inline">Settings</span>
          </Button>
          <!-- Import Calendar Button -->
          <Button
            variant="outline"
            size="sm"
            :disabled="importingCalendar"
            class="gap-2 border-border bg-card hover:border-primary/40"
            @click="triggerCalendarUpload"
          >
            <Upload
              class="h-4 w-4 text-muted-foreground"
              :class="{ 'animate-pulse': importingCalendar }"
            />
            <span class="hidden sm:inline">Import Calendar</span>
          </Button>
          <input
            ref="calendarInput"
            type="file"
            class="hidden"
            accept=".ics"
            @change="handleCalendarUpload"
          >
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="space-y-6 mt-2">
      <!-- Activity Grid (Always Visible) -->
      <YearlyActivityGrid />

      <!-- Yearly Mode Content (Table) -->
      <div v-if="viewMode === 'yearly'">
        <YearlyReport />
      </div>

      <!-- Monthly Mode Content (Tabs) -->
      <Tabs v-else default-value="daily" class="w-full">
        <TabsList class="grid w-full grid-cols-3">
          <TabsTrigger value="daily" class="gap-1.5">
            <FileText class="h-3.5 w-3.5" />
            Daily Report
          </TabsTrigger>
          <TabsTrigger value="monthly" class="gap-1.5">
            <CalendarDays class="h-3.5 w-3.5" />
            Monthly Report
          </TabsTrigger>
          <TabsTrigger value="activity" class="gap-1.5">
            <CalendarRange class="h-3.5 w-3.5" />
            Activity Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <DailyReport />
        </TabsContent>

        <TabsContent value="monthly">
          <MonthlyReport />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityCalendar />
        </TabsContent>
      </Tabs>
    </div>

    <!-- Modals -->
    <SettingsModal v-if="showSettings" v-model="showSettings" />

    <ManualActivityModal v-if="showManualEntry" v-model="showManualEntry" />
  </div>
</template>

<script setup lang="ts">
import { CalendarDays, CalendarRange, Settings, FileText, Upload } from 'lucide-vue-next'
import { useScrollLock } from '@vueuse/core'
import { Button } from '~/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/ui/tabs'
import DailyReport from '~/components/report/DailyReport.vue'
import YearlyActivityGrid from '~/components/report/YearlyActivityGrid.vue'

import { useCoreStore } from '~/stores/core'
import { useDailyStore } from '~/stores/daily'
import { useCalendarStore } from '~/stores/calendar'
import { storeToRefs } from 'pinia'

const YearlyReport = defineAsyncComponent(() => import('~/components/report/YearlyReport.vue'))
const ActivityCalendar = defineAsyncComponent(
  () => import('~/components/report/ActivityCalendar.vue'),
)
const MonthlyReport = defineAsyncComponent(() => import('~/components/report/MonthlyReport.vue'))
const ManualActivityModal = defineAsyncComponent(
  () => import('~/components/report/ManualActivityModal.vue'),
)

const SettingsModal = defineAsyncComponent(() => import('~/components/report/SettingsModal.vue'))

const coreStore = useCoreStore()

const { fetchSettings } = coreStore
const { showSettings, viewMode } = storeToRefs(coreStore)

const dailyStore = useDailyStore()
const { showManualEntry } = storeToRefs(dailyStore)

const calendarStore = useCalendarStore()
const { importingCalendar } = storeToRefs(calendarStore)
const { importCalendar } = calendarStore

// ─── Calendar Import ──────────────────────────────
const calendarInput = ref<HTMLInputElement | null>(null)

const triggerCalendarUpload = () => {
  calendarInput.value?.click()
}

const handleCalendarUpload = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    await importCalendar(file)
    // Reset input
    if (calendarInput.value) {
      calendarInput.value.value = ''
    }
  }
}

onMounted(() => {
  fetchSettings()
})

// ─── Scroll Lock ──────────────────────────────────
const isLocked = useScrollLock(import.meta.client ? document.body : null)
watch([showSettings, showManualEntry], ([s, m]) => {
  isLocked.value = s || m
})
</script>
