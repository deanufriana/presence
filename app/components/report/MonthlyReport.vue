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
            v-if="isAiEnabled"
            variant="ai"
            size="xs"
            @click="generateAiSummary"
            :disabled="!localRows.length || summarizing"
            class="relative overflow-hidden group"
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
            size="xs"
            @click="addMonthlyRow(formattedMonth)"
          >
            <Plus class="h-3.5 w-3.5" />
            Add Row
          </Button>

          <Button
            variant="outline"
            size="xs"
            @click="copyMonthlyReport"
            :disabled="!monthlyRows.length"
          >
            <Check v-if="copiedMonthly" class="h-3.5 w-3.5 text-emerald-500" />
            <Copy v-else class="h-3.5 w-3.5" />
            {{ copiedMonthly ? "Copied!" : "Copy" }}
          </Button>

          <Button
            variant="outline"
            size="xs"
            @click="handleDocxExport"
            :disabled="!monthlyRows.length || exportingDocx"
            class="border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-500/5 text-blue-600 dark:text-blue-400"
          >
            <File
              class="h-3.5 w-3.5"
              :class="{ 'animate-bounce': exportingDocx }"
            />
            {{ exportingDocx ? "Exporting..." : "Export Word" }}
          </Button>
        </div>
      </div>
      <!-- Monthly Highlights Section -->
      <div
        v-if="monthlyHighlights && isAiEnabled"
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
            @click="monthlyHighlights = ''"
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
                class="w-full h-full px-4 py-2 bg-transparent border-0 outline-none focus:ring-1 focus:ring-violet-500/30 transition-all"
                :placeholder="formattedMonth"
              />
            </td>
            <td class="p-0 relative group">
              <textarea
                v-model="row.project"
                rows="3"
                class="w-full px-4 py-2.5 bg-transparent border-0 outline-none focus:ring-1 focus:ring-violet-500/30 resize-y min-h-[44px] block text-sm leading-relaxed"
                placeholder="Feature / improvement description..."
              />

              <div
                class="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
              >
                <button
                  v-if="row.project"
                  @click.stop="copyRow(row.project, 'row-' + idx)"
                  class="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                  :title="
                    copiedRows['row-' + idx] ? 'Copied!' : 'Copy description'
                  "
                >
                  <Check
                    v-if="copiedRows['row-' + idx]"
                    class="h-3.5 w-3.5 text-emerald-500"
                  />
                  <Copy v-else class="h-3.5 w-3.5" />
                </button>
              </div>
            </td>
            <td class="p-0">
              <input
                v-model="row.progres"
                class="w-full h-full px-4 py-2 bg-transparent border-0 outline-none focus:ring-1 focus:ring-violet-500/30 transition-all"
                placeholder="100%"
              />
            </td>
            <td class="p-0">
              <Select v-model="row.done">
                <SelectTrigger
                  class="w-full h-full border-0 shadow-none focus:ring-0 focus:ring-offset-0 bg-transparent px-4 py-2 text-xs"
                >
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Done">Done</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </td>
            <td class="p-0">
              <Select v-model="row.status">
                <SelectTrigger
                  class="w-full h-full border-0 shadow-none focus:ring-0 focus:ring-offset-0 bg-transparent px-4 py-2 text-xs"
                >
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Project">Project</SelectItem>
                  <SelectItem value="Project Enhance"
                    >Project Enhance</SelectItem
                  >
                  <SelectItem value="Continuing (Daily)">
                    Continuing (Daily)
                  </SelectItem>
                </SelectContent>
              </Select>
            </td>
            <td class="p-0 text-center">
              <button
                @click="removeMonthlyRow(idx)"
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
  File,
} from "lucide-vue-next";
import { useDocxExport } from "~/composables/useDocxExport";
import { useToast } from "~/composables/use-toast";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { storeToRefs } from "pinia";
import { useCoreStore } from "~/stores/core";
import { useMonthlyStore } from "~/stores/monthly";
import { useDailyStore } from "~/stores/daily";
import { format, parse } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const coreStore = useCoreStore();
const monthlyStore = useMonthlyStore();
const dailyStore = useDailyStore();

const { isAiEnabled, selectedDate } = storeToRefs(coreStore);
const { monthlyRows, monthlyHighlights, summarizing, copiedMonthly } =
  storeToRefs(monthlyStore);
const { localRows } = storeToRefs(dailyStore);

const {
  generateAiSummary,
  addMonthlyRow,
  removeMonthlyRow,
  copyMonthlyReport,
} = monthlyStore;
const { exportToDocx, exportingDocx } = useDocxExport();
const { success, error } = useToast();

const handleDocxExport = async () => {
  try {
    await exportToDocx(
      monthlyRows.value,
      selectedDate.value,
      coreStore.settings,
    );
    success("Monthly report exported to Word!");
  } catch (err) {
    error("Failed to export Word document");
  }
};

const copiedRows = ref<Record<string, boolean>>({});

const copyRow = (text: string, id: string) => {
  navigator.clipboard.writeText(text);
  copiedRows.value[id] = true;
  setTimeout(() => {
    copiedRows.value[id] = false;
  }, 2000);
};

const formattedMonth = computed(() => {
  try {
    const d = parse(selectedDate.value, "yyyy-MM", new Date());
    return format(d, "MMMM", { locale: idLocale });
  } catch {
    return "";
  }
});
</script>
