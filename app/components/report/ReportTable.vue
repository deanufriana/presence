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
            <td class="p-0 relative group">
              <textarea
                v-model="row.aktivitas"
                rows="1"
                class="w-full px-4 py-2 pr-10 bg-transparent border-0 outline-none focus:ring-1 focus:ring-violet-500/30 resize-y min-h-[36px] block"
              />
              <button
                v-if="
                  (settings.ai_api_key || settings.openai_api_key) &&
                  row.aktivitas &&
                  row.aktivitas.length > 5
                "
                @click="summarizeRow(row)"
                class="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-md text-violet-500 hover:bg-violet-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
                :class="{ 'opacity-100': summarizingRows[row.date] }"
                :disabled="summarizingRows[row.date]"
                title="Summarize Day"
              >
                <Sparkles
                  class="h-3.5 w-3.5"
                  :class="{
                    'animate-spin text-violet-600': summarizingRows[row.date],
                  }"
                />
              </button>
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
import { FileText, Copy, Check, Sparkles } from "lucide-vue-next";
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

const { copyReport, summarizeRow } = useReport();
</script>
