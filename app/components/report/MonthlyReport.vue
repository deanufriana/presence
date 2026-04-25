<template>
  <Card
    class="overflow-hidden border-indigo-500/10 shadow-lg shadow-indigo-500/5"
  >
    <CardHeader class="border-b border-border/40 bg-muted/10">
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="flex items-center gap-2 text-base">
            <div
              class="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500/10"
            >
              <CalendarDays class="h-4 w-4 text-indigo-500" />
            </div>
            Monthly Report
          </CardTitle>
          <CardDescription class="mt-1"
            >Project highlights and progress summary</CardDescription
          >
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            @click="$emit('generateAiSummary')"
            :disabled="
              !localRows.length ||
              summarizing ||
              (!settings.ai_api_key && !settings.openai_api_key)
            "
            class="gap-1.5 text-xs h-8 border-violet-500/20 hover:bg-violet-500/5 text-violet-600 dark:text-violet-400 relative overflow-hidden group"
          >
            <div
              v-if="summarizing"
              class="absolute inset-0 bg-violet-500/10 animate-pulse"
            ></div>
            <Sparkles v-if="!summarizing" class="h-3.5 w-3.5" />
            <RefreshCw v-else class="h-3.5 w-3.5 animate-spin" />
            <span :class="{ 'animate-pulse': summarizing }">
              {{ summarizing ? "Generating..." : "AI Generate" }}
            </span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click="$emit('addRow', formattedMonth)"
            class="gap-1.5 text-xs h-8"
          >
            <Plus class="h-3.5 w-3.5" />
            Add Row
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click="$emit('copyMonthlyReport')"
            :disabled="!monthlyRows.length"
            class="gap-1.5 text-xs h-8"
          >
            <Check
              v-if="copiedMonthly"
              class="h-3.5 w-3.5 text-emerald-500"
            />
            <Copy v-else class="h-3.5 w-3.5" />
            {{ copiedMonthly ? "Copied!" : "Copy" }}
          </Button>
        </div>
      </div>
      <!-- Monthly Highlights Section -->
      <div
        v-if="monthlyHighlights"
        class="px-4 py-3 bg-violet-500/5 border-t border-violet-500/10 animate-in fade-in slide-in-from-top-1 mt-3"
      >
        <div class="flex items-start gap-3">
          <Sparkles class="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
          <div class="space-y-1 flex-1">
            <p
              class="text-xs font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wider"
            >
              AI Generated Summary
            </p>
            <p
              class="text-xs leading-relaxed text-muted-foreground whitespace-pre-line"
            >
              {{ monthlyHighlights }}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            @click="$emit('clearHighlights')"
            class="h-5 w-5 ml-auto text-muted-foreground hover:text-foreground shrink-0"
          >
            <X class="h-3 w-3" />
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent class="p-0 overflow-x-auto">
      <table class="w-full text-xs border-collapse min-w-[700px]">
        <thead class="bg-muted/30">
          <tr>
            <th
              class="px-4 py-3 text-left font-semibold border-b border-border/40 w-[100px]"
            >
              Bulan
            </th>
            <th
              class="px-4 py-3 text-left font-semibold border-b border-border/40"
            >
              Project Yang Dikerjakan
            </th>
            <th
              class="px-4 py-3 text-left font-semibold border-b border-border/40 w-[100px]"
            >
              Progres
            </th>
            <th
              class="px-4 py-3 text-left font-semibold border-b border-border/40 w-[100px]"
            >
              Done
            </th>
            <th
              class="px-4 py-3 text-left font-semibold border-b border-border/40 w-[160px]"
            >
              Status Pekerjaan
            </th>
            <th
              class="px-4 py-3 text-center font-semibold border-b border-border/40 w-[50px]"
            ></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, idx) in monthlyRows"
            :key="idx"
            class="border-b border-border/10 last:border-0 hover:bg-muted/5 transition-colors group"
          >
            <td class="p-0">
              <input
                v-model="row.bulan"
                class="w-full h-full px-4 py-2 bg-transparent border-0 outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all"
                :placeholder="formattedMonth"
              />
            </td>
            <td class="p-0">
              <textarea
                v-model="row.project"
                rows="1"
                class="w-full px-4 py-2 bg-transparent border-0 outline-none focus:ring-1 focus:ring-indigo-500/30 resize-y min-h-[36px] block"
                placeholder="Feature / improvement description..."
              />
            </td>
            <td class="p-0">
              <input
                v-model="row.progres"
                class="w-full h-full px-4 py-2 bg-transparent border-0 outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all"
                placeholder="100%"
              />
            </td>
            <td class="p-0">
              <select
                v-model="row.done"
                class="w-full h-full px-4 py-2 bg-transparent border-0 outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all cursor-pointer"
              >
                <option value="">—</option>
                <option value="Done">Done</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
              </select>
            </td>
            <td class="p-0">
              <select
                v-model="row.status"
                class="w-full h-full px-4 py-2 bg-transparent border-0 outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all cursor-pointer"
              >
                <option value="">—</option>
                <option value="Project">Project</option>
                <option value="Project Enhance">Project Enhance</option>
                <option value="Continuing (Daily)">Continuing (Daily)</option>
              </select>
            </td>
            <td class="p-0 text-center">
              <button
                @click="$emit('removeRow', idx)"
                class="h-6 w-6 mx-auto flex items-center justify-center rounded-md text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
                title="Remove row"
              >
                <Trash2 class="h-3 w-3" />
              </button>
            </td>
          </tr>
          <tr v-if="!monthlyRows.length">
            <td colspan="6" class="p-16">
              <div
                class="flex flex-col items-center justify-center text-center text-muted-foreground"
              >
                <CalendarDays class="h-8 w-8 mb-2 opacity-20" />
                <span
                  >Click "AI Generate" or "Add Row" to start your monthly
                  report...</span
                >
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import {
  CalendarDays,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  Plus,
  X,
  Trash2,
} from "lucide-vue-next";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";
import type {
  ReportRow,
  SettingsData,
  MonthlyReportRow,
} from "~/composables/useReport";
import { format, parse } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const props = defineProps<{
  localRows: ReportRow[];
  settings: SettingsData;
  summarizing: boolean;
  copiedMonthly: boolean;
  monthlyHighlights: string;
  monthlyRows: MonthlyReportRow[];
  selectedDate: string;
}>();

defineEmits<{
  clearHighlights: [];
  generateAiSummary: [];
  addRow: [monthName: string];
  removeRow: [idx: number];
  copyMonthlyReport: [];
}>();

const formattedMonth = computed(() => {
  try {
    const d = parse(props.selectedDate, "yyyy-MM", new Date());
    return format(d, "MMMM", { locale: idLocale });
  } catch {
    return "";
  }
});

</script>
