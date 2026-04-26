import {
  format,
  parseISO,
  startOfMonth,
  getDaysInMonth,
  getDay,
  parse,
} from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "vue-sonner";
import { parseICS } from "~/utils/ics";

// ─── Types ─────────────────────────────────────────
export interface ReportRow {
  date: string;
  masuk: string;
  pulang: string;
  ti: string;
  aktivitas: string;
}

export interface ReportResponse {
  success: boolean;
  report: string;
  rows: ReportRow[];
  raw: {
    gitlab: {
      success: boolean;
      events: any[];
      error?: string;
      cached?: boolean;
    };
  };
}

export interface SettingsData {
  gitlab_token: string;
  gitlab_url: string;
  gitlab_selected_projects: string;
  ai_api_key: string;
  openai_api_key: string;
}

export interface MonthlyReportRow {
  bulan: string;
  project: string;
  progres: string;
  done: string;
  status: string;
}

// ─── Shared State ────────────────────────────────
const selectedDate = ref(format(new Date(), "yyyy-MM"));
const showSettings = ref(false);
const saving = ref(false);
const copied = ref(false);
const summarizing = ref(false);
const monthlyHighlights = ref("");
const showManualEntry = ref(false);
const showConfirmSync = ref(false);
const syncing = ref(false);
const importingCalendar = ref(false);
const fetchingGitlab = ref(false);
const initialLoading = ref(true);
const gitlabData = ref<any>(null);
const calendarData = ref<any>(null);
const selectedDayForEntry = ref<{ date: string; dayNum: number } | null>(
  null,
);
const manualActivityText = ref("");
const manualActivitiesMap = ref<Record<string, string>>({});
const fetchingProjects = ref(false);
const allProjects = ref<{ id: number; name: string; path: string }[]>([]);
const summarizingRows = ref<Record<string, boolean>>({});
const selectedProjectIds = ref<number[]>([]);
const localRows = ref<ReportRow[]>([]);
const monthlyRows = ref<MonthlyReportRow[]>([]);
const copiedMonthly = ref(false);
const reportData = ref<ReportResponse | null>(null);
const pending = ref(false);

const settings = ref<SettingsData>({
  gitlab_token: "",
  gitlab_url: "https://gitlab.com",
  gitlab_selected_projects: "",
  ai_api_key: "",
  openai_api_key: "",
});

export function useReport () {
  // ─── Instance logic (will be shared) ───────────────

  // ─── Computed ──────────────────────────────────────
  const isAiEnabled = computed(() => !!(settings.value.ai_api_key || settings.value.openai_api_key));

  const formattedDate = computed(() => {
    const d = parse(selectedDate.value, "yyyy-MM", new Date());
    return format(d, "MMMM yyyy", { locale: idLocale });
  });

  const filteredGitLab = computed(() => {
    if (!gitlabData.value?.events) return [];
    const processed = new Set<string>();
    const results: string[] = [];

    const events = Array.isArray(gitlabData.value.events)
      ? gitlabData.value.events
      : [];

    for (const ev of events) {
      let desc = "";
      const action = ev.action_name?.toLowerCase() || "";
      const target = ev.target_type?.toLowerCase() || "";
      const project = ev.project_name || ev.target_title || "Project";

      if (action === "pushed_commit") {
        const projectLabel = ev.project_path || project;
        const branchLabel = ev.branch_name ? ` (${ev.branch_name})` : "";
        desc = `[${projectLabel}]${branchLabel} ${ev.title}`;
      } else if (action.includes("pushed") && ev.push_data) {
        const branch = ev.push_data.ref.replace("refs/heads/", "");
        desc = `Pushed to ${project} (${branch})`;
      } else if (action === "opened" && target.includes("mergerequest")) {
        desc = `Opened MR: ${ev.target_title}`;
      } else if (action === "merged" && target.includes("mergerequest")) {
        desc = `Merged MR: ${ev.target_title}`;
      } else if (action === "accepted" && target.includes("mergerequest")) {
        desc = `Accepted MR: ${ev.target_title}`;
      } else if (action === "commented on") {
        desc = `Commented on ${target}: ${ev.target_title || project}`;
      } else {
        desc =
          `${ev.action_name} ${ev.target_type || ""} on ${project}`.trim();
      }

      if (desc && !processed.has(desc)) {
        processed.add(desc);
        results.push(desc);
      }
    }
    return results;
  });

  const calendarBlanks = computed(() => {
    const d = parse(selectedDate.value, "yyyy-MM", new Date());
    return getDay(startOfMonth(d));
  });

  const calendarDays = computed(() => {
    const d = parse(selectedDate.value, "yyyy-MM", new Date());
    const daysInMonth = getDaysInMonth(d);
    const [yearStr, monthStr] = selectedDate.value.split("-");

    const results = [];
    const commits = gitlabData.value?.events || [];

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${yearStr}-${monthStr}-${String(i).padStart(2, "0")}`;
      const dayCommits = commits.filter((c: any) => {
        if (!c.created_at) return false;
        const cDate = new Date(c.created_at).toLocaleDateString("en-CA", {
          timeZone: "Asia/Jakarta",
        });
        return cDate === dateStr;
      });

      const dayEvents = (calendarData.value?.events || []).filter(
        (e: any) => e.date === dateStr,
      );

      results.push({
        dayNum: i,
        date: dateStr,
        count: dayCommits.length,
        commits: dayCommits,
        calendarEvents: dayEvents,
        hasManual: !!manualActivitiesMap.value[dateStr],
      });
    }
    return results;
  });

  // ─── Methods ───────────────────────────────────────

  async function loadCachedData () {
    initialLoading.value = true;
    try {
      const [cachedGitlab, cachedCalendar, reportRes, monthlyRes]: any =
        await Promise.all([
          $fetch("/api/gitlab/cache" as any, {
            query: { date: selectedDate.value },
          }),
          $fetch("/api/calendar/cache" as any, {
            query: { date: selectedDate.value },
          }),
          $fetch("/api/report/daily" as any, {
            query: { date: selectedDate.value },
          }),
          $fetch("/api/report/monthly" as any, {
            query: { month: selectedDate.value },
          }),
        ]);

      gitlabData.value = cachedGitlab;
      calendarData.value = cachedCalendar;

      if (reportRes.success && reportRes.reports) {
        const map: Record<string, string> = {};
        const rows: ReportRow[] = reportRes.reports.map((r: any) => {
          if (r.aktivitas) map[r.date] = r.aktivitas;
          return {
            date: r.date,
            masuk: r.masuk || "",
            pulang: r.pulang || "",
            ti: r.ti || "",
            aktivitas: r.aktivitas || "",
          };
        });
        manualActivitiesMap.value = map;
        localRows.value = rows;
      } else {
        manualActivitiesMap.value = {};
        localRows.value = [];
      }

      if (monthlyRes.success && monthlyRes.report) {
        monthlyRows.value = monthlyRes.report.rows || [];
        monthlyHighlights.value = monthlyRes.report.summary || "";
      } else {
        monthlyRows.value = [];
        monthlyHighlights.value = "";
      }
    } catch (error) {
      console.error("Failed to load cached data:", error);
    } finally {
      initialLoading.value = false;
    }
  }

  async function fetchGitlabFresh () {
    fetchingGitlab.value = true;
    try {
      const res: any = await $fetch("/api/gitlab" as any, {
        query: { date: selectedDate.value, force: "true" },
      });
      gitlabData.value = res;
    } catch (error) {
      console.error("Failed to fetch GitLab data:", error);
    } finally {
      fetchingGitlab.value = false;
    }
  }

  function confirmSync () {
    if (localRows.value.length > 0) {
      showConfirmSync.value = true;
    } else {
      executeSync();
    }
  }

  async function executeSync () {
    showConfirmSync.value = false;
    syncing.value = true;
    pending.value = true;
    try {
      const res: any = await $fetch("/api/report/daily/sync" as any, {
        query: { date: selectedDate.value, force: "true" },
      });
      reportData.value = res;
      if (res?.success && res.rows) {
        const newRows = res.rows;
        const currentRows = [...localRows.value];

        newRows.forEach((newRow: any) => {
          const existingRowIndex = currentRows.findIndex(
            (r) => r.date === newRow.date,
          );
          if (existingRowIndex !== -1) {
            const existingRow = currentRows[existingRowIndex];
            if (!existingRow) return;
            const existingActs = (existingRow.aktivitas || "")
              .split(";")
              .map((s: string) => s.trim())
              .filter(Boolean);
            const incomingActs = (newRow.aktivitas || "")
              .split(";")
              .map((s: string) => s.trim())
              .filter(Boolean);

            incomingActs.forEach((act: string) => {
              if (
                !existingActs.some(
                  (ea) => ea.toLowerCase() === act.toLowerCase(),
                )
              ) {
                existingActs.push(act);
              }
            });

            existingRow.aktivitas = existingActs.join("; ");
          } else {
            currentRows.push(newRow);
          }
        });

        currentRows.sort((a, b) => a.date.localeCompare(b.date));
        localRows.value = currentRows;

        await $fetch("/api/report/daily" as any, {
          method: "POST",
          body: localRows.value,
        });

        localRows.value.forEach((r) => {
          if (r.aktivitas) manualActivitiesMap.value[r.date] = r.aktivitas;
        });
      }
      if (res?.raw?.gitlab) {
        gitlabData.value = res.raw.gitlab;
      }
    } catch (error) {
      console.error("Failed to sync:", error);
    } finally {
      syncing.value = false;
      pending.value = false;
    }
  }

  async function refreshReport () {
    await executeSync();
  }

  async function persistSettings () {
    await $fetch("/api/settings" as any, {
      method: "POST",
      body: settings.value,
    });
  }

  async function fetchProjects () {
    fetchingProjects.value = true;
    try {
      // Save settings first so backend has the latest token/url
      await persistSettings();

      const res: any = await $fetch("/api/gitlab/projects" as any);
      if (res.success) {
        allProjects.value = res.projects;
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      toast.error("Failed to fetch projects. Please check your token/url.");
    } finally {
      fetchingProjects.value = false;
    }
  }

  function toggleProject (projectId: number) {
    const index = selectedProjectIds.value.indexOf(projectId);
    if (index === -1) {
      selectedProjectIds.value.push(projectId);
    } else {
      selectedProjectIds.value.splice(index, 1);
    }
    settings.value.gitlab_selected_projects =
      selectedProjectIds.value.join(",");
  }

  async function saveSettings () {
    saving.value = true;
    try {
      await persistSettings();
      showSettings.value = false;
      toast.success("Settings saved!");
      refreshReport();
    } catch {
      toast.error("Failed to save settings");
    } finally {
      saving.value = false;
    }
  }

  const copyReport = () => {
    if (!localRows.value.length) return;

    let tsv = `Tanggal\tMasuk\tPulang\tTI\tAktivitas\n`;
    localRows.value.forEach((row) => {
      tsv += `${row.date}\t${row.masuk}\t${row.pulang}\t${row.ti}\t${row.aktivitas}\n`;
    });

    navigator.clipboard.writeText(tsv);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  };

  const summarizeRow = async (row: ReportRow) => {
    if (!row.aktivitas || row.aktivitas.length < 10) return;
    summarizingRows.value[row.date] = true;

    const activities = row.aktivitas
      .split(";")
      .map((a: string) => a.trim())
      .filter((a: string) => a);

    try {
      const res: any = await $fetch("/api/report/daily/summary" as any, {
        method: "POST",
        body: { activities },
      });

      if (res.success) {
        row.aktivitas = res.summary;
        toast.success(`Summary generated for ${row.date}`);
      } else {
        toast.error(res.error || "Failed to generate summary");
      }
    } catch (error: any) {
      console.error("Failed to summarize row:", error);
      toast.error("Failed to connect to AI service");
    } finally {
      summarizingRows.value[row.date] = false;
    }
  };

  const generateAiSummary = async () => {
    if (!localRows.value.length) return;
    summarizing.value = true;
    const loadingToastId = toast.loading("Generating monthly report with AI...");

    try {
      const allActivities = localRows.value
        .filter((r) => r.aktivitas && r.aktivitas.length > 5)
        .map((r) => r.aktivitas)
        .join("\n");

      if (!allActivities) {
        summarizing.value = false;
        return;
      }

      const res: any = await $fetch("/api/report/monthly/summary" as any, {
        method: "POST",
        body: {
          activities: allActivities.split("\n"),
        },
      });

      if (res.success) {
        monthlyHighlights.value = res.summary;
        const parsedRows = parseMonthlySummaryToRows(
          res.summary,
          selectedDate.value,
        );
        if (parsedRows.length > 0) {
          monthlyRows.value = parsedRows;
        }
        toast.success("Monthly highlights generated!");

        // Persist highlights and rows
        await $fetch("/api/report/monthly" as any, {
          method: "POST",
          body: {
            month: selectedDate.value,
            rows: monthlyRows.value,
            summary: res.summary,
          },
        });
      } else {
        toast.error(res.error || "Failed to generate summary", {
          description: "Please check AI prompt, API key, or model response.",
        });
      }
    } catch (error) {
      console.error("Failed to generate monthly summary:", error);
      toast.error("AI service error. Please check your API key.");
    } finally {
      toast.dismiss(loadingToastId);
      summarizing.value = false;
    }
  };

  function parseMonthlySummaryToRows (
    summary: string,
    selectedMonth: string,
  ): MonthlyReportRow[] {
    const lines = summary
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const monthLabel = format(
      parse(selectedMonth, "yyyy-MM", new Date()),
      "MMMM",
      { locale: idLocale },
    );

    const rows: MonthlyReportRow[] = [];
    let currentProject = "";

    for (const line of lines) {
      const projectMatch = line.match(/^\*\*(.+?)\*\*$/);
      if (projectMatch) {
        currentProject = projectMatch[1]?.trim() || "Project";
        continue;
      }

      if (line.startsWith("-")) {
        const bulletText = line.replace(/^-+\s*/, "").trim();
        if (!bulletText) continue;

        const statusMatch = bulletText.match(
          /\[Status:\s*(Project Enhance|Project|Continuing \(Daily\))\]\s*$/i,
        );
        const aiStatus = statusMatch
          ? normalizeMonthlyStatus(statusMatch[1] || "")
          : "Project";
        const cleanBulletText = bulletText
          .replace(
            /\[Status:\s*(Project Enhance|Project|Continuing \(Daily\))\]\s*$/i,
            "",
          )
          .trim();

        rows.push({
          bulan: monthLabel,
          project: currentProject
            ? `${currentProject}: ${cleanBulletText}`
            : cleanBulletText,
          progres: "100%",
          done: "Done",
          status: aiStatus,
        });
      }
    }

    return rows;
  }

  function normalizeMonthlyStatus (status: string): string {
    const normalized = status.trim().toLowerCase();
    if (normalized === "project enhance") return "Project Enhance";
    if (normalized === "continuing (daily)") return "Continuing (Daily)";
    return "Project";
  }

  function addMonthlyRow (monthName?: string) {
    monthlyRows.value.push({
      bulan: monthName || "",
      project: "",
      progres: "100%",
      done: "Done",
      status: "Project",
    });
  }

  function removeMonthlyRow (idx: number) {
    monthlyRows.value.splice(idx, 1);
  }

  function removeDailyRow (idx: number) {
    localRows.value.splice(idx, 1);
  }

  const copyMonthlyReport = () => {
    if (!monthlyRows.value.length) return;

    let tsv = `Bulan\tProject Yang Dikerjakan\tProgres\tDone\tStatus Pekerjaan\n`;
    monthlyRows.value.forEach((row) => {
      tsv += `${row.bulan}\t${row.project}\t${row.progres}\t${row.done}\t${row.status}\n`;
    });

    navigator.clipboard.writeText(tsv);
    copiedMonthly.value = true;
    setTimeout(() => (copiedMonthly.value = false), 2000);
  };

  const openManualEntry = (day: any) => {
    selectedDayForEntry.value = { date: day.date, dayNum: day.dayNum };
    manualActivityText.value = manualActivitiesMap.value[day.date] || "";
    showManualEntry.value = true;
  };

  const saveManualActivity = async () => {
    if (!selectedDayForEntry.value) return;

    await $fetch("/api/report/daily" as any, {
      method: "POST",
      body: {
        date: selectedDayForEntry.value.date,
        activity: manualActivityText.value,
      },
    });

    manualActivitiesMap.value[selectedDayForEntry.value.date] =
      manualActivityText.value;
    showManualEntry.value = false;
    refreshReport();
  };

  const deleteManualActivity = async (date: string) => {
    try {
      // Update local map reactively
      const newMap = { ...manualActivitiesMap.value };
      delete newMap[date];
      manualActivitiesMap.value = newMap;

      // Update localRows so the table reflects the deletion.
      // If a row only exists for manual activity, remove the date row entirely.
      const rowIndex = localRows.value.findIndex((r) => r.date === date);
      if (rowIndex !== -1) {
        const row = localRows.value[rowIndex];
        if (!row) return;
        const hasOtherValues =
          !!row.masuk?.trim() || !!row.pulang?.trim() || !!row.ti?.trim();

        if (hasOtherValues) {
          const target = localRows.value[rowIndex];
          if (target) target.aktivitas = "";
          await $fetch("/api/report/daily" as any, {
            method: "POST",
            body: { date, activity: "" },
          });
        } else {
          localRows.value.splice(rowIndex, 1);
          await $fetch("/api/report/daily" as any, {
            method: "DELETE",
            body: { date },
          });
        }
      } else {
        await $fetch("/api/report/daily" as any, {
          method: "POST",
          body: { date, activity: "" },
        });
      }

      toast.success(`Activity removed for ${date}`);
    } catch (error) {
      console.error("Failed to delete activity:", error);
      toast.error("Failed to delete activity");
    }
  };

  const syncDayActivity = async (date: string) => {
    try {
      const dayCommits = (gitlabData.value?.events || []).filter((c: any) => {
        if (!c.created_at) return false;
        const cDate = new Date(c.created_at).toLocaleDateString("en-CA", {
          timeZone: "Asia/Jakarta",
        });
        return cDate === date;
      });

      if (!dayCommits.length) {
        toast.error(`No commits found for ${date}`);
        return;
      }

      const commitsText = dayCommits
        .map((c: any) => {
          const title = (c?.title || "").trim();
          if (!title) return "";
          const projectLabel = c?.project_path || c?.project_name || "Project";
          const branchLabel = c?.branch_name ? ` (${c.branch_name})` : "";
          return `[${projectLabel}]${branchLabel} ${title}`;
        })
        .filter(Boolean);

      if (!commitsText.length) {
        toast.error(`No commit titles found for ${date}`);
        return;
      }

      const uniqueCommits = Array.from(
        new Map(
          commitsText.map((item: string) => [item.toLowerCase(), item]),
        ).values(),
      );
      const nextActivity = uniqueCommits.join("; ");

      manualActivitiesMap.value[date] = nextActivity;

      const rowIndex = localRows.value.findIndex((r) => r.date === date);
      if (rowIndex !== -1) {
        const target = localRows.value[rowIndex];
        if (target) target.aktivitas = nextActivity;
      } else {
        localRows.value.push({
          date,
          masuk: "",
          pulang: "",
          ti: "",
          aktivitas: nextActivity,
        });
        localRows.value.sort((a, b) => a.date.localeCompare(b.date));
      }

      await $fetch("/api/report/daily" as any, {
        method: "POST",
        body: { date, activity: nextActivity },
      });

      toast.success(`Activity synced from commits for ${date}`);
    } catch (error) {
      console.error("Failed to sync day activity:", error);
      toast.error("Failed to sync day activity");
    }
  };

  const importCalendar = async (file: File) => {
    importingCalendar.value = true;
    const loadingToastId = toast.loading("Importing calendar events...");

    try {
      const content = await file.text();
      const events = parseICS(content);

      if (events.length === 0) {
        toast.error("No events found in the calendar file.");
        return;
      }

      // Group events by date
      const groupedEvents: Record<string, string[]> = {};
      events.forEach((ev) => {
        let group = groupedEvents[ev.date];
        if (!group) {
          group = [];
          groupedEvents[ev.date] = group;
        }
        // Only add if not already present
        if (!group.includes(ev.summary)) {
          group.push(ev.summary);
        }
      });

      // Prepare updates
      const updates: ReportRow[] = [];
      const currentRows = [...localRows.value];

      Object.entries(groupedEvents).forEach(([date, newActs]) => {
        const existingRowIndex = currentRows.findIndex((r) => r.date === date);
        let updatedAktivitas = "";

        if (existingRowIndex !== -1) {
          const row = currentRows[existingRowIndex];
          if (!row) return;
          const existingActs = (row.aktivitas || "")
            .split(";")
            .map((s) => s.trim())
            .filter(Boolean);

          newActs.forEach((act) => {
            if (
              !existingActs.some((ea) => ea.toLowerCase() === act.toLowerCase())
            ) {
              existingActs.push(act);
            }
          });
          updatedAktivitas = existingActs.join("; ");
          row.aktivitas = updatedAktivitas;
          updates.push(row);
        } else {
          updatedAktivitas = newActs.join("; ");
          const newRow: ReportRow = {
            date,
            masuk: "",
            pulang: "",
            ti: "",
            aktivitas: updatedAktivitas,
          };
          currentRows.push(newRow);
          updates.push(newRow);
        }

        manualActivitiesMap.value[date] = updatedAktivitas;
      });

      // Save to backend
      if (updates.length > 0) {
        currentRows.sort((a, b) => a.date.localeCompare(b.date));
        localRows.value = currentRows;

        await Promise.all([
          $fetch("/api/report/daily" as any, {
            method: "POST",
            body: updates,
          }),
          $fetch("/api/calendar/cache" as any, {
            method: "POST",
            body: {
              date: selectedDate.value,
              events: events,
            },
          }),
        ]);

        // Refresh calendar data locally
        calendarData.value = {
          success: true,
          events: events,
          date: selectedDate.value,
          cached: true,
        };
      }

      toast.success(`Successfully imported ${events.length} events!`, {
        id: loadingToastId,
      });
    } catch (error) {
      console.error("Failed to import calendar:", error);
      toast.error("Failed to import calendar file", { id: loadingToastId });
    } finally {
      importingCalendar.value = false;
    }
  };

  function formatTime (dateStr: string) {
    try {
      return format(parseISO(dateStr), "HH:mm");
    } catch (e) {
      return dateStr;
    }
  }

  // ─── Watchers ──────────────────────────────────────
  watch(selectedDate, () => {
    loadCachedData();
  });

  let saveTimeout: any = null;
  watch(
    localRows,
    (newRows) => {
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(async () => {
        if (newRows.length > 0) {
          await $fetch("/api/report/daily" as any, {
            method: "POST",
            body: newRows,
          });

          newRows.forEach((r) => {
            if (r.aktivitas) manualActivitiesMap.value[r.date] = r.aktivitas;
            else delete manualActivitiesMap.value[r.date];
          });
        }
      }, 1000);
    },
    { deep: true },
  );

  let monthlySaveTimeout: any = null;
  watch(
    monthlyRows,
    (newRows) => {
      if (monthlySaveTimeout) clearTimeout(monthlySaveTimeout);
      monthlySaveTimeout = setTimeout(async () => {
        if (newRows.length >= 0) {
          await $fetch("/api/report/monthly" as any, {
            method: "POST",
            body: {
              month: selectedDate.value,
              rows: newRows,
            },
          });
        }
      }, 1000);
    },
    { deep: true },
  );

  // ─── Init ──────────────────────────────────────────
  onMounted(async () => {
    const data: any = await $fetch("/api/settings" as any);
    if (data) {
      settings.value = { ...settings.value, ...data };
      if (settings.value.gitlab_selected_projects) {
        selectedProjectIds.value = settings.value.gitlab_selected_projects
          .split(",")
          .map(Number);
      }
    }
    await loadCachedData();
  });

  return {
    // State
    selectedDate,
    showSettings,
    saving,
    copied,
    summarizing,
    monthlyHighlights,
    showManualEntry,
    showConfirmSync,
    syncing,
    importingCalendar,
    fetchingGitlab,
    initialLoading,
    gitlabData,
    selectedDayForEntry,
    manualActivityText,
    manualActivitiesMap,
    fetchingProjects,
    allProjects,
    summarizingRows,
    selectedProjectIds,
    localRows,
    reportData,
    pending,
    settings,
    monthlyRows,
    copiedMonthly,

    // Computed
    isAiEnabled,
    formattedDate,
    filteredGitLab,
    calendarBlanks,
    calendarDays,

    // Methods
    loadCachedData,
    fetchGitlabFresh,
    confirmSync,
    executeSync,
    refreshReport,
    fetchProjects,
    toggleProject,
    saveSettings,
    copyReport,
    summarizeRow,
    generateAiSummary,
    addMonthlyRow,
    removeMonthlyRow,
    removeDailyRow,
    openManualEntry,
    saveManualActivity,
    deleteManualActivity,
    syncDayActivity,
    importCalendar,
    formatTime,
    copyMonthlyReport,
  };
}
