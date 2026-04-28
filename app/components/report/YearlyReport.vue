<template>
  <Card
    class="overflow-hidden border-amber-500/10 shadow-lg shadow-amber-500/5"
  >
    <CardHeader class="border-b border-border/40 bg-muted/10">
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="flex items-center gap-2 text-base">
            <div
              class="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/10"
            >
              <Calendar class="h-4 w-4 text-amber-500" />
            </div>
            Yearly Report (BAST)
          </CardTitle>
          <CardDescription class="mt-1"
            >Annual Berita Acara Serah Terima summary</CardDescription
          >
        </div>
        <div class="flex items-center gap-2">
          <Button
            v-if="isAiEnabled"
            variant="ai"
            size="xs"
            @click="generateAiSummary"
            :disabled="!monthlyRows.length || summarizing"
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

          <Button variant="outline" size="xs" @click="addYearlyRow">
            <Plus class="h-3.5 w-3.5" />
            Add Row
          </Button>

          <Button
            variant="outline"
            size="xs"
            @click="copyYearlyReport"
            :disabled="!yearlyRows.length"
          >
            <Check v-if="copiedYearly" class="h-3.5 w-3.5 text-emerald-500" />
            <Copy v-else class="h-3.5 w-3.5" />
            {{ copiedYearly ? "Copied!" : "Copy" }}
          </Button>

          <Button
            variant="outline"
            size="xs"
            @click="handleBastExport"
            :disabled="!yearlyRows.length || exportingDocx"
            class="border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/5 text-orange-600 dark:text-orange-400"
          >
            <File
              class="h-3.5 w-3.5"
              :class="{ 'animate-bounce': exportingDocx }"
            />
            Export BAST
          </Button>
        </div>
      </div>
      <!-- Yearly Highlights Section -->
      <div
        v-if="yearlyHighlights && isAiEnabled"
        class="px-4 py-3 bg-amber-500/5 border-t border-amber-500/10 animate-in fade-in slide-in-from-top-1 mt-3"
      >
        <div class="flex items-start gap-3">
          <Sparkles class="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <div class="space-y-1 flex-1">
            <p
              class="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider"
            >
              Yearly AI Summary
            </p>
            <p
              class="text-xs leading-relaxed text-muted-foreground whitespace-pre-line"
            >
              {{ yearlyHighlights }}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            @click="yearlyHighlights = ''"
            class="h-5 w-5 ml-auto text-muted-foreground hover:text-foreground shrink-0"
          >
            <X class="h-3 w-3" />
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent class="p-0 overflow-x-auto">
      <table class="w-full text-xs border-collapse min-w-[900px]">
        <thead class="bg-muted/30">
          <tr>
            <th
              class="px-4 py-3 text-center font-semibold border-b border-border/40 w-[50px]"
            >
              No
            </th>
            <th
              class="px-4 py-3 text-left font-semibold border-b border-border/40 w-[120px]"
            >
              Tanggal
            </th>
            <th
              class="px-4 py-3 text-left font-semibold border-b border-border/40 w-[120px]"
            >
              Bulan
            </th>
            <th
              class="px-4 py-3 text-left font-semibold border-b border-border/40"
            >
              Task/Aktivitas
            </th>
            <th
              class="px-4 py-3 text-left font-semibold border-b border-border/40 w-[120px]"
            >
              Deliverable
            </th>
            <th
              class="px-4 py-3 text-left font-semibold border-b border-border/40 w-[100px]"
            >
              Status
            </th>
            <th
              class="px-4 py-3 text-left font-semibold border-b border-border/40 w-[160px]"
            >
              Keterangan
            </th>
            <th
              class="px-4 py-3 text-center font-semibold border-b border-border/40 w-[50px]"
            ></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, idx) in yearlyRows"
            :key="idx"
            class="border-b border-border/10 last:border-0 hover:bg-muted/5 transition-colors group"
          >
            <td
              class="px-4 py-3 text-center font-medium text-muted-foreground bg-muted/5"
            >
              {{ idx + 1 }}
            </td>
            <td class="p-0">
              <input
                v-model="row.tanggal"
                class="w-full px-4 py-2 bg-transparent border-0 outline-none focus:ring-1 focus:ring-amber-500/30"
                placeholder="dd/mm/yyyy"
              />
            </td>
            <td class="p-0">
              <input
                v-model="row.month"
                class="w-full px-4 py-2 bg-transparent border-0 outline-none focus:ring-1 focus:ring-amber-500/30"
                placeholder="Month/Year"
              />
            </td>
            <td class="p-0">
              <textarea
                v-model="row.task"
                rows="2"
                class="w-full px-4 py-2 bg-transparent border-0 outline-none focus:ring-1 focus:ring-amber-500/30 resize-y"
                placeholder="Task description..."
              />
            </td>
            <td class="p-0">
              <input
                v-model="row.deliverable"
                class="w-full px-4 py-2 bg-transparent border-0 outline-none focus:ring-1 focus:ring-amber-500/30"
              />
            </td>
            <td class="p-0">
              <input
                v-model="row.status"
                class="w-full px-4 py-2 bg-transparent border-0 outline-none focus:ring-1 focus:ring-amber-500/30"
              />
            </td>
            <td class="p-0">
              <Select v-model="row.keterangan">
                <SelectTrigger
                  class="w-full border-0 shadow-none bg-transparent px-4 py-2 text-xs"
                >
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Project">Project</SelectItem>
                  <SelectItem value="Project Enhance"
                    >Project Enhance</SelectItem
                  >
                  <SelectItem value="Continuing (Daily)"
                    >Continuing (Daily)</SelectItem
                  >
                </SelectContent>
              </Select>
            </td>
            <td class="p-0 text-center">
              <button
                @click="removeYearlyRow(idx)"
                class="h-6 w-6 mx-auto flex items-center justify-center rounded-md text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 class="h-3 w-3" />
              </button>
            </td>
          </tr>
          <tr v-if="!yearlyRows.length">
            <td colspan="8" class="p-16 text-center text-muted-foreground">
              <Calendar class="h-8 w-8 mb-2 mx-auto opacity-20" />
              <span>Select a month in the header to load yearly data...</span>
            </td>
          </tr>
        </tbody>
      </table>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import {
  Calendar,
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
import { useYearlyStore } from "~/stores/yearly";

const coreStore = useCoreStore();
const yearlyStore = useYearlyStore();
const monthlyStore = useMonthlyStore();

const { isAiEnabled, selectedDate } = storeToRefs(coreStore);
const { yearlyRows, yearlyHighlights, summarizing, copiedYearly } =
  storeToRefs(yearlyStore);
const { monthlyRows } = storeToRefs(monthlyStore);

const {
  generateAiSummary,
  addYearlyRow,
  removeYearlyRow,
  copyYearlyReport,
  fetchYearlyData,
} = yearlyStore;

const { exportBAST, exportingDocx } = useDocxExport();
const { success, error } = useToast();

const handleBastExport = async () => {
  try {
    // Map yearly rows to what exportBAST expects (MonthlyReportRow)
    const mappedRows = yearlyRows.value.map((r) => ({
      month: r.month,
      project: r.task,
      progres: "100%",
      done: r.status,
      status: r.keterangan,
    }));

    await exportBAST(mappedRows, selectedDate.value, coreStore.settings);
    success("BAST document exported to Word!");
  } catch (err) {
    error("Failed to export BAST document");
  }
};

onMounted(() => {
  fetchYearlyData();
});

watch(selectedDate, () => {
  fetchYearlyData();
});
</script>
