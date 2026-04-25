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
            <GitMerge class="h-4 w-4 text-orange-500" />
          </div>
          GitLab Activity ({{ formattedDate }})
        </CardTitle>
        <div class="flex items-center gap-4">
          <div
            class="flex items-center gap-2 text-[10px] text-muted-foreground"
          >
            <div class="flex items-center gap-1">
              <div class="h-2 w-2 rounded-sm bg-muted"></div>
              No commits
            </div>
            <div class="flex items-center gap-1">
              <div class="h-2 w-2 rounded-sm bg-orange-500/30"></div>
              1-2
            </div>
            <div class="flex items-center gap-1">
              <div class="h-2 w-2 rounded-sm bg-orange-500"></div>
              3+
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            @click="$emit('refreshGitlab')"
            :disabled="fetchingGitlab"
            class="gap-1.5 text-xs h-7 border-orange-500/20 hover:bg-orange-500/5 text-orange-600 dark:text-orange-400"
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
            @click="$emit('openManualEntry', day)"
            class="relative aspect-square rounded-md border border-border/40 flex flex-col items-center justify-center group transition-all cursor-pointer hover:border-primary"
            :class="[
              day.count > 0
                ? 'bg-orange-500/5 border-orange-500/20'
                : day.hasManual
                  ? 'bg-blue-500/5 border-blue-500/20'
                  : 'bg-muted/10',
              day.count >= 3 ? 'ring-1 ring-orange-500/30' : '',
              day.hasManual && day.count === 0
                ? 'ring-1 ring-blue-500/30'
                : '',
            ]"
          >
            <!-- Day Action Button (top-right) -->
            <button
              v-if="day.hasManual"
              @click.stop="$emit('deleteManualActivity', day.date)"
              class="absolute -top-1.5 -right-1.5 h-7 w-7 flex items-center justify-center rounded-full border border-red-500/50 bg-red-500/25 text-red-200 hover:bg-red-500/40 hover:text-white shadow-lg shadow-red-500/20 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
              title="Delete activity"
            >
              <Trash2 class="h-4 w-4" />
            </button>
            <button
              v-else-if="day.count > 0"
              @click.stop="$emit('syncDayActivity', day.date)"
              class="absolute -top-1.5 -right-1.5 h-7 w-7 flex items-center justify-center rounded-full border border-orange-500/50 bg-orange-500/20 text-orange-200 hover:bg-orange-500/35 hover:text-white shadow-lg shadow-orange-500/20 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
              title="Sync activity from commits"
            >
              <RefreshCw class="h-4 w-4" />
            </button>

            <span
              class="text-[10px] font-medium"
              :class="
                day.count > 0
                  ? 'text-orange-600 dark:text-orange-400'
                  : day.hasManual
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-muted-foreground'
              "
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
              <!-- Manual Dot (Blue) -->
              <div
                v-if="day.hasManual"
                class="h-1 w-1 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"
              />
            </div>

            <!-- Hover Tooltip -->
            <div
              v-if="day.count > 0"
              class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-popover border rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50"
            >
              <div class="text-[10px] font-bold mb-1 pb-1 border-b">
                {{ day.date }}
              </div>
              <div class="space-y-1">
                <div
                  v-for="(commit, cIdx) in day.commits.slice(0, 3)"
                  :key="cIdx"
                  class="text-[9px] leading-tight flex items-start gap-1"
                >
                  <div
                    class="h-1 w-1 rounded-full bg-orange-500 mt-1 shrink-0"
                  />
                  <div class="min-w-0">
                    <div class="truncate">{{ commit.title }}</div>
                    <div class="truncate text-[8px] text-muted-foreground">
                      {{ commit.project_path || commit.project_name || "Project" }}
                      <span v-if="commit.branch_name"> • {{ commit.branch_name }}</span>
                    </div>
                  </div>
                </div>
                <div
                  v-if="day.count > 3"
                  class="text-[8px] text-muted-foreground pl-2"
                >
                  + {{ day.count - 3 }} more
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
import { GitMerge, RefreshCw, Trash2 } from "lucide-vue-next";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "~/components/ui/card";

defineProps<{
  formattedDate: string;
  fetchingGitlab: boolean;
  calendarBlanks: number;
  calendarDays: any[];
}>();

defineEmits<{
  openManualEntry: [day: any];
  refreshGitlab: [];
  deleteManualActivity: [date: string];
  syncDayActivity: [date: string];
}>();
</script>
