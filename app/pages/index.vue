<template>
  <div class="flex flex-col gap-4 max-w-5xl mx-auto">
    <!-- Page Header -->
    <div class="flex flex-col gap-1">
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 class="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p class="text-sm text-muted-foreground mt-1">
            Generate your daily activity report from GitLab activity.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <!-- Settings Button -->
          <Button
            variant="outline"
            size="sm"
            @click="showSettings = true"
            class="gap-2"
          >
            <Settings class="h-4 w-4" />
            <span class="hidden sm:inline">Settings</span>
          </Button>
          <!-- Import Calendar Button -->
          <Button
            variant="outline"
            size="sm"
            @click="triggerCalendarUpload"
            :disabled="importingCalendar"
            class="gap-2 border-border bg-card hover:border-primary/40"
          >
            <Upload
              class="h-4 w-4 text-muted-foreground"
              :class="{ 'animate-pulse': importingCalendar }"
            />
            <span class="hidden sm:inline">Import Calendar</span>
          </Button>
          <input
            type="file"
            ref="calendarInput"
            class="hidden"
            accept=".ics"
            @change="handleCalendarUpload"
          />

          <!-- Sync Button -->
          <Button
            variant="gradient"
            size="sm"
            @click="confirmSync()"
            :disabled="syncing"
          >
            <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': syncing }" />
            <span class="hidden sm:inline">Sync Activities</span>
          </Button>
        </div>
      </div>
    </div>

    <!-- Status Bar -->
    <div class="flex items-center gap-4 text-xs text-muted-foreground">
      <div class="flex items-center gap-1.5">
        <div
          class="h-2 w-2 rounded-full"
          :class="gitlabData?.success ? 'bg-emerald-500' : 'bg-amber-500'"
        />
        <span
          >GitLab {{ gitlabData?.success ? "Connected" : "Disconnected" }}</span
        >
      </div>
      <div class="ml-auto text-muted-foreground/60">
        {{ dateDisplay }}
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
    <SettingsModal
      v-model="showSettings"
      :settings="settings"
      :saving="saving"
      :fetching-projects="fetchingProjects"
      :all-projects="allProjects"
      :selected-project-ids="selectedProjectIds"
    />

    <SyncConfirmModal v-model="showConfirmSync" @confirm="executeSync" />

    <ManualActivityModal
      v-model="showManualEntry"
      :selected-day="selectedDayForEntry"
      :activity-text="manualActivityText"
      @update:activity-text="manualActivityText = $event"
      @save="saveManualActivity"
    />
  </div>
</template>

<script setup lang="ts">
import {
  CalendarDays,
  CalendarRange,
  Calendar,
  Settings,
  FileText,
  Upload,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-vue-next";
import { useScrollLock } from "@vueuse/core";
import { Button } from "~/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { format, parse } from "date-fns";
import DailyReport from "~/components/report/DailyReport.vue";
import MonthlyReport from "~/components/report/MonthlyReport.vue";
import YearlyReport from "~/components/report/YearlyReport.vue";
import ActivityCalendar from "~/components/report/ActivityCalendar.vue";
import MonthPicker from "~/components/report/MonthPicker.vue";
import SettingsModal from "~/components/report/SettingsModal.vue";
import SyncConfirmModal from "~/components/report/SyncConfirmModal.vue";
import ManualActivityModal from "~/components/report/ManualActivityModal.vue";
import YearlyActivityGrid from "~/components/report/YearlyActivityGrid.vue";

import { useCoreStore } from "~/stores/core";
import { useDailyStore } from "~/stores/daily";
import { useGitlabStore } from "~/stores/gitlab";
import { useCalendarStore } from "~/stores/calendar";
import { storeToRefs } from "pinia";

const coreStore = useCoreStore();
const gitlabStore = useGitlabStore();

const { selectedDate, showSettings, saving, pending, settings, viewMode } =
  storeToRefs(coreStore);

const { fetchingProjects, allProjects, selectedProjectIds, gitlabData } =
  storeToRefs(gitlabStore);

const dailyStore = useDailyStore();

const {
  showConfirmSync,
  showManualEntry,
  selectedDayForEntry,
  manualActivityText,
  syncing,
} = storeToRefs(dailyStore);

const { executeSync, saveManualActivity, confirmSync } = dailyStore;

const calendarStore = useCalendarStore();
const { importingCalendar } = storeToRefs(calendarStore);
const { importCalendar } = calendarStore;

onMounted(() => {
  coreStore.init();
});

// ─── Date Display ────────────────────────────────
const dateDisplay = computed(() => {
  try {
    const d = parse(selectedDate.value, "yyyy-MM", new Date());
    return format(d, "MMMM yyyy");
  } catch {
    return selectedDate.value;
  }
});

// ─── Calendar Import ──────────────────────────────
const calendarInput = ref<HTMLInputElement | null>(null);

const triggerCalendarUpload = () => {
  calendarInput.value?.click();
};

const handleCalendarUpload = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    await importCalendar(file);
    // Reset input
    if (calendarInput.value) {
      calendarInput.value.value = "";
    }
  }
};

// ─── Scroll Lock ──────────────────────────────────
const isLocked = useScrollLock(process.client ? document.body : null);
watch([showSettings, showManualEntry], ([s, m]) => {
  isLocked.value = s || m;
});
</script>
