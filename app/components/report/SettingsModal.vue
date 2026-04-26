<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-md"
          @click="$emit('update:modelValue', false)"
        />

        <!-- Dialog -->
        <Card
          class="relative z-10 w-full h-[95vh] sm:h-auto sm:max-w-2xl shadow-2xl border-border/50 rounded-t-2xl sm:rounded-xl flex flex-col overflow-hidden"
        >
          <CardHeader>
            <CardTitle class="flex items-center gap-2 text-base">
              <Settings class="h-4 w-4 text-muted-foreground" />
              Settings
            </CardTitle>
            <CardDescription>
              API tokens are stored locally in your SQLite database.
            </CardDescription>
          </CardHeader>

          <CardContent
            class="space-y-6 flex-1 overflow-y-auto p-4 sm:p-6 sm:max-h-[75vh]"
          >
            <!-- GitLab Section -->
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <div
                  class="h-5 w-5 rounded bg-orange-500/10 flex items-center justify-center"
                >
                  <GitMerge class="h-3 w-3 text-orange-500" />
                </div>
                <span class="text-sm font-medium">GitLab</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-7">
                <div class="space-y-1.5">
                  <Label class="text-xs">Personal Access Token</Label>
                  <Input
                    v-model="settings.gitlab_token"
                    type="password"
                    placeholder="glpat-xxxxxxxxxxxx"
                    class="h-9 text-sm"
                  />
                </div>
                <div class="space-y-1.5">
                  <Label class="text-xs">Instance URL</Label>
                  <Input
                    v-model="settings.gitlab_url"
                    placeholder="https://gitlab.com"
                    class="h-9 text-sm"
                  />
                </div>
              </div>

              <div class="space-y-2 pt-2 pl-7">
                <div class="flex items-center justify-between">
                  <Label class="text-xs">Tracked Projects</Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    @click="fetchProjects"
                    :disabled="fetchingProjects || !settings.gitlab_token"
                    class="h-6 text-[10px] gap-1"
                  >
                    <RefreshCw
                      class="h-3 w-3"
                      :class="{ 'animate-spin': fetchingProjects }"
                    />
                    Fetch List
                  </Button>
                </div>

                <div
                  class="max-h-40 overflow-y-auto border rounded-md bg-muted/20 p-2 space-y-1"
                >
                  <div
                    v-if="!allProjects.length && !fetchingProjects"
                    class="text-[10px] text-muted-foreground text-center py-2"
                  >
                    No projects fetched. Click "Fetch List".
                  </div>
                  <div
                    v-else-if="fetchingProjects"
                    class="text-[10px] text-center py-2 animate-pulse"
                  >
                    Loading projects...
                  </div>
                  <div
                    v-for="p in allProjects"
                    :key="p.id"
                    class="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent/50 cursor-pointer"
                    @click="toggleProject(p.id)"
                  >
                    <div
                      class="h-3.5 w-3.5 rounded border border-primary flex items-center justify-center shrink-0"
                      :class="{
                        'bg-primary': selectedProjectIds.includes(p.id),
                      }"
                    >
                      <Check
                        v-if="selectedProjectIds.includes(p.id)"
                        class="h-2.5 w-2.5 text-primary-foreground"
                      />
                    </div>
                    <div class="flex flex-col">
                      <span class="text-[10px] font-medium leading-none">{{
                        p.name
                      }}</span>
                      <span class="text-[9px] text-muted-foreground">{{
                        p.path
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- AI Section -->
            <div class="space-y-3 pt-2 border-t border-border/40">
              <div class="flex items-center gap-2">
                <div
                  class="h-5 w-5 rounded bg-violet-500/10 flex items-center justify-center"
                >
                  <Sparkles class="h-3 w-3 text-violet-500" />
                </div>
                <span class="text-sm font-medium">AI Summary (Gemini)</span>
              </div>
              <div class="space-y-3 pl-7">
                <div class="space-y-1.5">
                  <Label class="text-xs">Gemini API Key</Label>
                  <Input
                    v-model="settings.ai_api_key"
                    type="password"
                    placeholder="Enter your Google AI API Key"
                    class="h-9 text-sm"
                  />
                  <p class="text-[10px] text-muted-foreground">
                    Used to summarize technical commits into simple activity
                    descriptions.
                  </p>
                </div>
                <div class="space-y-1.5">
                  <Label class="text-xs">OpenAI API Key (ChatGPT)</Label>
                  <Input
                    v-model="settings.openai_api_key"
                    type="password"
                    placeholder="sk-xxxxxxxxxxxxxxxx"
                    class="h-9 text-sm"
                  />
                  <p class="text-[10px] text-muted-foreground">
                    Alternative provider. Uses gpt-4o-mini for fast and reliable
                    summaries.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter class="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              @click="$emit('update:modelValue', false)"
              >Cancel</Button
            >
            <Button
              size="sm"
              @click="saveSettings"
              :disabled="saving"
              class="gap-1.5 min-w-[100px]"
            >
              <RefreshCw v-if="saving" class="h-3.5 w-3.5 animate-spin" />
              {{ saving ? "Saving..." : "Save Changes" }}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import {
  Settings,
  RefreshCw,
  GitMerge,
  Sparkles,
  Check,
} from "lucide-vue-next";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useCoreStore } from "~/stores/core";
import { useGitlabStore } from "~/stores/gitlab";
import type { SettingsData } from "~/types/report";

defineProps<{
  modelValue: boolean;
  settings: SettingsData;
  saving: boolean;
  fetchingProjects: boolean;
  allProjects: { id: number; name: string; path: string }[];
  selectedProjectIds: number[];
}>();

defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const coreStore = useCoreStore();
const gitlabStore = useGitlabStore();

const { saveSettings } = coreStore;
const { fetchProjects, toggleProject } = gitlabStore;
</script>
