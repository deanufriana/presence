<template>
  <div class="flex flex-col gap-8 max-w-5xl mx-auto">
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
          <!-- Date Picker -->
          <Popover>
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                size="sm"
                class="w-[180px] justify-start text-left font-medium gap-2 border-border bg-card hover:border-primary/40"
              >
                <CalendarIcon class="h-4 w-4 text-muted-foreground shrink-0" />
                {{ dateDisplay }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-64 p-3" align="end">
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <Button variant="outline" size="icon" class="h-7 w-7" @click="changeYear(-1)">
                    <ChevronLeft class="h-4 w-4" />
                  </Button>
                  <div class="text-sm font-bold">{{ pickerYear }}</div>
                  <Button variant="outline" size="icon" class="h-7 w-7" @click="changeYear(1)">
                    <ChevronRight class="h-4 w-4" />
                  </Button>
                </div>
                <div class="grid grid-cols-3 gap-2">
                  <Button
                    v-for="(m, i) in months"
                    :key="m"
                    size="sm"
                    variant="ghost"
                    class="h-9 w-full text-[10px] font-medium"
                    :class="{ 'bg-primary text-primary-foreground hover:bg-primary/90': isCurrentMonth(i) }"
                    @click="selectMonth(i)"
                  >
                    {{ m }}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

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

          <!-- Sync GitLab Button -->
          <Button
            size="sm"
            @click="confirmSync"
            :disabled="syncing"
            class="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 shadow-md shadow-violet-500/20"
          >
            <GitMerge class="h-4 w-4" :class="{ 'animate-spin': syncing }" />
            <span class="hidden sm:inline">Sync GitLab</span>
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
      <Separator orientation="vertical" class="h-3" />
      <div class="flex items-center gap-1.5">
        <div class="h-2 w-2 rounded-full bg-emerald-500" />
        <span>Manual Activities</span>
      </div>
      <div class="ml-auto text-muted-foreground/60">
        {{ formattedDate }}
      </div>
    </div>

    <!-- Tabs -->
    <Tabs default-value="daily" class="w-full">
      <TabsList class="grid w-full grid-cols-3">
        <TabsTrigger value="daily" class="gap-1.5">
          <FileText class="h-3.5 w-3.5" />
          Daily Report
        </TabsTrigger>
        <TabsTrigger value="monthly" class="gap-1.5">
          <CalendarDays class="h-3.5 w-3.5" />
          Monthly Report
        </TabsTrigger>
        <TabsTrigger value="gitlab" class="gap-1.5">
          <GitMerge class="h-3.5 w-3.5" />
          GitLab Activity
        </TabsTrigger>
      </TabsList>

      <TabsContent value="daily">
        <ReportTable
          :local-rows="localRows"
          :settings="settings"
          :copied="copied"
          :pending="pending"
          :summarizing-rows="summarizingRows"
        />
      </TabsContent>

      <TabsContent value="monthly">
        <MonthlyReport
          :local-rows="localRows"
          :settings="settings"
          :summarizing="summarizing"
          :copied-monthly="copiedMonthly"
          :monthly-highlights="monthlyHighlights"
          :monthly-rows="monthlyRows"
          :selected-date="selectedDate"
          @clear-highlights="monthlyHighlights = ''"
          @generate-ai-summary="generateAiSummary"
          @add-row="addMonthlyRow"
          @remove-row="removeMonthlyRow"
          @copy-monthly-report="copyMonthlyReport"
        />
      </TabsContent>

      <TabsContent value="gitlab">
        <GitlabCalendar
          :formatted-date="formattedDate"
          :fetching-gitlab="fetchingGitlab"
          :calendar-blanks="calendarBlanks"
          :calendar-days="calendarDays"
          @open-manual-entry="openManualEntry"
          @refresh-gitlab="fetchGitlabFresh"
          @delete-manual-activity="deleteManualActivity"
          @sync-day-activity="syncDayActivity"
        />
      </TabsContent>
    </Tabs>

    <!-- Modals -->
    <SettingsModal
      v-model="showSettings"
      :settings="settings"
      :saving="saving"
      :fetching-projects="fetchingProjects"
      :all-projects="allProjects"
      :selected-project-ids="selectedProjectIds"
    />

    <SyncConfirmModal
      v-model="showConfirmSync"
      @confirm="executeSyncGitlab"
    />

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
  Calendar as CalendarIcon,
  CalendarDays,
  Settings,
  GitMerge,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-vue-next";
import { useScrollLock } from "@vueuse/core";
import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { format, parse, isValid, startOfMonth, setMonth, setYear } from "date-fns";
import { DateFormatter, getLocalTimeZone } from "@internationalized/date";
import { useVModel } from "@vueuse/core";
import ReportTable from "~/components/report/ReportTable.vue";
import MonthlyReport from "~/components/report/MonthlyReport.vue";
import GitlabCalendar from "~/components/report/GitlabCalendar.vue";
import SettingsModal from "~/components/report/SettingsModal.vue";
import SyncConfirmModal from "~/components/report/SyncConfirmModal.vue";
import ManualActivityModal from "~/components/report/ManualActivityModal.vue";

const {
  selectedDate,
  showSettings,
  saving,
  copied,
  summarizing,
  monthlyHighlights,
  showManualEntry,
  showConfirmSync,
  syncing,
  fetchingGitlab,
  gitlabData,
  selectedDayForEntry,
  manualActivityText,
  fetchingProjects,
  allProjects,
  summarizingRows,
  selectedProjectIds,
  localRows,
  pending,
  settings,
  monthlyRows,
  copiedMonthly,
  formattedDate,
  calendarBlanks,
  calendarDays,
  fetchGitlabFresh,
  confirmSync,
  executeSyncGitlab,
  openManualEntry,
  saveManualActivity,
  deleteManualActivity,
  syncDayActivity,
  generateAiSummary,
  copyMonthlyReport,
  addMonthlyRow,
  removeMonthlyRow,
} = useReport();

// ─── Date Handling ────────────────────────────────
const df = new DateFormatter("en-US", {
  month: "long",
  year: "numeric",
});

const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const internalDate = ref(new Date());

// Sync string "YYYY-MM" to internalDate
watch(selectedDate, (newVal) => {
  if (!newVal) return;
  const parsed = parse(newVal, "yyyy-MM", new Date());
  if (isValid(parsed)) {
    internalDate.value = parsed;
  }
}, { immediate: true });

const pickerYear = computed(() => internalDate.value.getFullYear());

const changeYear = (delta: number) => {
  internalDate.value = setYear(internalDate.value, internalDate.value.getFullYear() + delta);
  selectedDate.value = format(internalDate.value, "yyyy-MM");
};

const selectMonth = (monthIndex: number) => {
  internalDate.value = setMonth(internalDate.value, monthIndex);
  selectedDate.value = format(internalDate.value, "yyyy-MM");
};

const isCurrentMonth = (monthIndex: number) => {
  return internalDate.value.getMonth() === monthIndex;
};

const dateDisplay = computed(() => {
  return df.format(internalDate.value);
});

// ─── Scroll Lock ──────────────────────────────────
const isLocked = useScrollLock(process.client ? document.body : null);
watch([showSettings, showManualEntry], ([s, m]) => {
  isLocked.value = s || m;
});
</script>
