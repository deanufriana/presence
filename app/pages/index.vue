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
            Generate your daily activity report from GitLab &amp; Microsoft
            Calendar.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <!-- Date Picker -->
          <div
            class="relative flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-sm transition-colors hover:border-primary/40"
          >
            <CalendarIcon class="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="month"
              v-model="selectedDate"
              class="bg-transparent border-none outline-none text-sm font-medium w-[150px] cursor-pointer"
            />
          </div>

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
} from "lucide-vue-next";
import { useScrollLock } from "@vueuse/core";
import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
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

// ─── Scroll Lock ──────────────────────────────────
const isLocked = useScrollLock(process.client ? document.body : null);
watch([showSettings, showManualEntry], ([s, m]) => {
  isLocked.value = s || m;
});
</script>
