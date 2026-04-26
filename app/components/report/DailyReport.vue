<template>
  <Card
    class="overflow-hidden border-violet-500/10 shadow-lg shadow-violet-500/5"
  >
    <CardHeader class="border-b border-border/40 bg-muted/10">
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="flex items-center gap-2 text-base">
            <div
              class="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500/10"
            >
              <FileText class="h-4 w-4 text-violet-500" />
            </div>
            Daily Report
          </CardTitle>
          <CardDescription class="mt-1"
            >Daily attendance and activity log</CardDescription
          >
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            @click="copyReport"
            :disabled="!localRows.length"
            class="gap-1.5 text-xs h-8"
          >
            <Check v-if="copied" class="h-3.5 w-3.5 text-emerald-500" />
            <Copy v-else class="h-3.5 w-3.5" />
            {{ copied ? "Copied!" : "Copy" }}
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent class="p-0 overflow-x-auto">
      <table class="w-full text-xs border-collapse min-w-[700px]">
        <thead class="bg-muted/30">
          <tr>
            <th
              class="px-4 py-3 text-left font-semibold border-b border-border/40 w-[120px]"
            >
              Tanggal
            </th>
            <th
              class="px-4 py-3 text-left font-semibold border-b border-border/40 w-[100px]"
            >
              Masuk
            </th>
            <th
              class="px-4 py-3 text-left font-semibold border-b border-border/40 w-[100px]"
            >
              Pulang
            </th>
            <th
              class="px-4 py-3 text-left font-semibold border-b border-border/40 w-[60px]"
            >
              TI
            </th>
            <th
              class="px-4 py-3 text-left font-semibold border-b border-border/40"
            >
              Aktivitas
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, idx) in localRows"
            :key="idx"
            class="border-b border-border/10 last:border-0 hover:bg-muted/5 transition-colors"
          >
            <td class="px-4 py-2 font-medium text-muted-foreground">
              {{ row.date }}
            </td>
            <td class="p-0">
              <input
                v-model="row.masuk"
                class="w-full h-full px-4 py-2 bg-transparent border-0 outline-none focus:ring-1 focus:ring-violet-500/30 transition-all"
              />
            </td>
            <td class="p-0">
              <input
                v-model="row.pulang"
                class="w-full h-full px-4 py-2 bg-transparent border-0 outline-none focus:ring-1 focus:ring-violet-500/30 transition-all"
              />
            </td>
            <td class="p-0">
              <input
                v-model="row.ti"
                class="w-full h-full px-4 py-2 bg-transparent border-0 outline-none focus:ring-1 focus:ring-violet-500/30 transition-all"
              />
            </td>
            <td class="p-0 relative group min-h-[44px]">
              <div
                @click="
                  openManualEntry({
                    date: row.date,
                    dayNum: parseInt(row.date.split('-').pop() || '0'),
                  })
                "
                class="w-full h-full min-h-[44px] px-4 py-2.5 cursor-pointer hover:bg-violet-500/5 transition-colors whitespace-pre-wrap text-sm leading-relaxed relative"
              >
                <div
                  :class="{
                    'animate-pulse opacity-50': summarizingRows[row.date],
                  }"
                  class="transition-all duration-500"
                >
                  <span v-if="row.aktivitas">{{ row.aktivitas }}</span>
                  <span
                    v-else
                    class="text-muted-foreground/40 italic text-[11px]"
                    >Click to add activity...</span
                  >
                </div>

                <div
                  v-if="summarizingRows[row.date]"
                  class="absolute inset-0 flex items-center justify-center bg-violet-500/5 backdrop-blur-[1px] rounded-md z-20"
                ></div>
              </div>

              <div
                class="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
              >
                <button
                  v-if="row.aktivitas"
                  @click.stop="copyRow(row.aktivitas, row.date)"
                  class="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                  :title="copiedRows[row.date] ? 'Copied!' : 'Copy activity'"
                >
                  <Check
                    v-if="copiedRows[row.date]"
                    class="h-3.5 w-3.5 text-emerald-500"
                  />
                  <Copy v-else class="h-3.5 w-3.5" />
                </button>

                <button
                  v-if="
                    isAiEnabled &&
                    row.aktivitas &&
                    row.aktivitas.length > 5
                  "
                  @click.stop="summarizeRow(row)"
                  class="h-6 w-6 flex items-center justify-center rounded-md text-violet-500 hover:bg-violet-500/10 transition-all"
                  :class="{
                    'opacity-100 bg-violet-500/5': summarizingRows[row.date],
                  }"
                  :disabled="summarizingRows[row.date]"
                  title="Summarize Day"
                >
                  <RefreshCw
                    v-if="summarizingRows[row.date]"
                    class="h-3.5 w-3.5 animate-spin text-violet-600"
                  />
                  <Sparkles v-else class="h-3.5 w-3.5" />
                </button>

                <button
                  @click.stop="removeDailyRow(idx)"
                  class="h-6 w-6 flex items-center justify-center rounded-md text-red-400 hover:bg-red-500/10 transition-all"
                  title="Delete row"
                >
                  <Trash2 class="h-3.5 w-3.5" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!localRows.length && !pending">
            <td colspan="5" class="p-16">
              <div
                class="flex flex-col items-center justify-center text-center text-muted-foreground"
              >
                <FileText class="h-8 w-8 mb-2 opacity-20" />
                <span>Click "Sync GitLab" to create your report...</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { FileText, Copy, Check, Sparkles, RefreshCw, Trash2 } from "lucide-vue-next";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";
import type { ReportRow, SettingsData } from "~/composables/useReport";

defineProps<{
  localRows: ReportRow[];
  settings: SettingsData;
  copied: boolean;
  pending: boolean;
  summarizingRows: Record<string, boolean>;
}>();

const { copyReport, summarizeRow, openManualEntry, isAiEnabled, removeDailyRow } = useReport();

const copiedRows = ref<Record<string, boolean>>({});

const copyRow = (text: string, date: string) => {
  navigator.clipboard.writeText(text);
  copiedRows.value[date] = true;
  setTimeout(() => {
    copiedRows.value[date] = false;
  }, 2000);
};
</script>
