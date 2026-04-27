<template>
  <Card
    class="overflow-hidden border-orange-500/10 shadow-lg shadow-orange-500/5"
  >
    <CardHeader class="border-b border-border/40 bg-muted/10">
      <div class="flex items-center justify-between">
        <CardTitle class="flex items-center gap-2 text-base">
          <div
            class="flex h-7 w-7 items-center justify-center rounded-md bg-orange-500/10"
          >
            <CalendarRange class="h-4 w-4 text-orange-500" />
          </div>
          Activity Calendar ({{ formattedDate }})
        </CardTitle>
        <div class="flex items-center gap-4">
          <div
            class="flex items-center gap-2 text-[10px] text-muted-foreground"
          >
            <div class="flex items-center gap-1">
              <div class="h-2 w-2 rounded-sm bg-orange-500"></div>
              GitLab
            </div>
            <div class="flex items-center gap-1">
              <div class="h-2 w-2 rounded-sm bg-violet-500"></div>
              Calendar
            </div>
            <div class="flex items-center gap-1">
              <div class="h-2 w-2 rounded-sm bg-blue-500"></div>
              Manual
            </div>
          </div>
          <Button
            variant="orange"
            size="xxs"
            @click="fetchGitlabFresh()"
            :disabled="fetchingGitlab"
          >
            <RefreshCw
              class="h-3 w-3"
              :class="{ 'animate-spin': fetchingGitlab }"
            />
            Refresh
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent class="p-6">
      <div v-if="fetchingGitlab" class="grid grid-cols-7 gap-2">
        <div
          v-for="i in 31"
          :key="i"
          class="aspect-square bg-muted/40 animate-pulse rounded-md"
        />
      </div>

      <div v-else class="space-y-4">
        <!-- Calendar Grid -->
        <div class="grid grid-cols-7 gap-2">
          <div
            v-for="day in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']"
            :key="day"
            class="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pb-1"
          >
            {{ day }}
          </div>

          <!-- Blank days -->
          <div
            v-for="blank in calendarBlanks"
            :key="'blank-' + blank"
            class="aspect-square"
          />

          <!-- Days with indicators -->
          <div
            v-for="day in calendarDays"
            :key="day.date"
            @click="openManualEntry(day)"
            class="relative aspect-square rounded-md border border-border/40 flex flex-col items-center justify-center group transition-all cursor-pointer hover:border-primary"
            :class="getDayContainerClasses(day)"
          >
            <!-- Day Action Button (top-right) -->
            <button
              v-if="day.hasManual"
              @click.stop="deleteActivity(day.date)"
              class="absolute -top-1.5 -right-1.5 h-7 w-7 flex items-center justify-center rounded-full border border-red-500/50 bg-red-500/25 text-red-200 hover:bg-red-500/40 hover:text-white shadow-lg shadow-red-500/20 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
              title="Delete activity"
            >
              <Trash2 class="h-4 w-4" />
            </button>
            <button
              v-if="day.count > 0"
              @click.stop="syncDayActivity(day.date)"
              class="absolute -top-1.5 -left-1.5 h-7 w-7 flex items-center justify-center rounded-full border border-emerald-500/50 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/35 hover:text-white shadow-lg shadow-emerald-500/20 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
              :class="{
                'opacity-100 bg-emerald-500/40': syncingRows[day.date],
              }"
              :disabled="syncingRows[day.date]"
              title="Sync activity from commits"
            >
              <RefreshCw
                class="h-4 w-4"
                :class="{ 'animate-spin': syncingRows[day.date] }"
              />
            </button>

            <span
              class="text-[10px] font-medium"
              :class="getDayTextClasses(day)"
              >{{ day.dayNum }}</span
            >

            <!-- Activity Dots -->
            <div class="flex gap-0.5 mt-1">
              <!-- Commit Dots (Orange) -->
              <div
                v-for="dot in Math.min(day.count, 3)"
                :key="'c-' + dot"
                class="h-1 w-1 rounded-full bg-orange-500"
              />
              <!-- Calendar Event Dot (Violet) -->
              <div
                v-if="day.calendarEvents?.length > 0"
                class="h-1 w-1 rounded-full bg-violet-500 shadow-sm shadow-violet-500/50"
              />
              <!-- Manual Dot (Blue) -->
              <div
                v-if="day.hasManual"
                class="h-1 w-1 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"
              />
            </div>

            <!-- Hover Tooltip -->
            <div
              v-if="
                day.count > 0 ||
                (day.calendarEvents && day.calendarEvents.length > 0)
              "
              class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-popover border rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50"
            >
              <div class="text-[10px] font-bold mb-1 pb-1 border-b">
                {{ day.date }}
              </div>
              <div class="space-y-2">
                <!-- Commits -->
                <div v-if="day.count > 0" class="space-y-1">
                  <div
                    class="text-[8px] font-bold text-orange-500 uppercase tracking-tighter"
                  >
                    GitLab Commits
                  </div>
                  <div
                    v-for="(commit, cIdx) in day.commits.slice(0, 3)"
                    :key="'commit-' + cIdx"
                    class="text-[9px] leading-tight flex items-start gap-1"
                  >
                    <div
                      class="h-1 w-1 rounded-full bg-orange-500 mt-1 shrink-0"
                    />
                    <div class="min-w-0">
                      <div class="truncate">{{ commit.title }}</div>
                    </div>
                  </div>
                  <div
                    v-if="day.count > 3"
                    class="text-[8px] text-muted-foreground pl-2"
                  >
                    + {{ day.count - 3 }} more
                  </div>
                </div>

                <!-- Calendar Events -->
                <div v-if="day.calendarEvents?.length > 0" class="space-y-1">
                  <div
                    class="text-[8px] font-bold text-violet-500 uppercase tracking-tighter"
                  >
                    Calendar
                  </div>
                  <div
                    v-for="(ev, eIdx) in day.calendarEvents.slice(0, 3)"
                    :key="'event-' + eIdx"
                    class="text-[9px] leading-tight flex items-start gap-1"
                  >
                    <div
                      class="h-1 w-1 rounded-full bg-violet-500 mt-1 shrink-0"
                    />
                    <div class="min-w-0">
                      <div class="truncate">{{ ev.summary }}</div>
                    </div>
                  </div>
                  <div
                    v-if="day.calendarEvents.length > 3"
                    class="text-[8px] text-muted-foreground pl-2"
                  >
                    + {{ day.calendarEvents.length - 3 }} more
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useCoreStore } from "~/stores/core";
import { useDailyStore } from "~/stores/daily";
import { useGitlabStore } from "~/stores/gitlab";
import { useCalendarStore } from "~/stores/calendar";
import { CalendarRange, RefreshCw, Trash2 } from "lucide-vue-next";
import { Button } from "~/components/ui/button";
import { format, parse, isWeekend } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";

const coreStore = useCoreStore();
const dailyStore = useDailyStore();
const gitlabStore = useGitlabStore();
const calendarStore = useCalendarStore();

const { fetchingGitlab } = storeToRefs(gitlabStore);
const { calendarBlanks, calendarDays } = storeToRefs(calendarStore);

const { syncingRows } = storeToRefs(dailyStore);
const { openManualEntry, deleteActivity, syncDayActivity } = dailyStore;
const { fetchGitlabFresh } = gitlabStore;

const formattedDate = computed(() => {
  try {
    const d = parse(coreStore.selectedDate, "yyyy-MM", new Date());
    return format(d, "MMMM yyyy", { locale: idLocale });
  } catch {
    return "";
  }
});

// ─── Class Helpers ────────────────────────────────
const getDayContainerClasses = (day: any) => {
  const classes = [];

  // Background and border base
  if (day.count > 0) {
    classes.push("bg-orange-500/5 border-orange-500/20");
  } else if (day.calendarEvents?.length > 0) {
    classes.push("bg-violet-500/5 border-violet-500/20");
  } else if (day.hasManual) {
    classes.push("bg-blue-500/5 border-blue-500/20");
  } else if (isWeekend(new Date(day.date))) {
    classes.push("bg-red-500/10 border-red-500/20");
  } else {
    classes.push("bg-muted/10");
  }

  // Ring indicators
  if (day.count >= 3) {
    classes.push("ring-1 ring-orange-500/30");
  }

  if (day.calendarEvents?.length > 0 && day.count === 0) {
    classes.push("ring-1 ring-violet-500/30");
  }

  if (
    day.hasManual &&
    day.count === 0 &&
    (!day.calendarEvents || day.calendarEvents.length === 0)
  ) {
    classes.push("ring-1 ring-blue-500/30");
  }

  return classes;
};

const getDayTextClasses = (day: any) => {
  if (day.count > 0) return "text-orange-600 dark:text-orange-400";
  if (day.calendarEvents?.length > 0)
    return "text-violet-600 dark:text-violet-400";
  if (day.hasManual) return "text-blue-600 dark:text-blue-400";
  if (isWeekend(new Date(day.date))) return "text-red-600 dark:text-red-400 font-bold";
  return "text-muted-foreground";
};
</script>
