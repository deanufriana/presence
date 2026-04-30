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

          <CardContent class="space-y-6 flex-1 overflow-y-auto p-4 sm:p-6 sm:max-h-[75vh]">
            <!-- Profile Section -->
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <div class="h-5 w-5 rounded bg-blue-500/10 flex items-center justify-center">
                  <User class="h-3 w-3 text-blue-500" />
                </div>
                <span class="text-sm font-medium">Profile Info</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-7">
                <div class="space-y-1.5">
                  <Label class="text-xs">Full Name</Label>
                  <Input
                    v-model="settings.user_name"
                    placeholder="Michael Johnson"
                    class="h-9 text-sm"
                  />
                </div>
                <div class="space-y-1.5">
                  <Label class="text-xs">Position</Label>
                  <Input
                    v-model="settings.user_position"
                    placeholder="Staff IT Governance"
                    class="h-9 text-sm"
                  />
                </div>
                <div class="space-y-1.5">
                  <Label class="text-xs">Nopeg</Label>
                  <Input
                    v-model="settings.user_nopeg"
                    placeholder="700012410952025"
                    class="h-9 text-sm"
                  />
                </div>
                <div class="space-y-1.5">
                  <Label class="text-xs">Unit Kerja</Label>
                  <Input
                    v-model="settings.user_unit"
                    placeholder="Teknologi Informasi"
                    class="h-9 text-sm"
                  />
                </div>
                <div class="space-y-1.5">
                  <Label class="text-xs">Bagian / Fungsi Kerja</Label>
                  <Input
                    v-model="settings.user_function"
                    placeholder="Developer"
                    class="h-9 text-sm"
                  />
                </div>
              </div>
            </div>

            <!-- Signatories Section -->
            <div class="space-y-3 pt-2 border-t border-border/40">
              <div class="flex items-center gap-2">
                <div class="h-5 w-5 rounded bg-emerald-500/10 flex items-center justify-center">
                  <FileText class="h-3 w-3 text-emerald-500" />
                </div>
                <span class="text-sm font-medium">Document Signatories</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 pl-7">
                <!-- Team Leader -->
                <div class="space-y-1.5">
                  <Label class="text-[10px] uppercase text-muted-foreground font-semibold"
                    >Team Leader</Label
                  >
                  <Input
                    v-model="settings.team_leader_name"
                    placeholder="Name"
                    class="h-8 text-sm"
                  />
                </div>
                <div class="space-y-1.5">
                  <Label class="text-[10px] uppercase text-muted-foreground font-semibold"
                    >TL Position</Label
                  >
                  <Input
                    v-model="settings.team_leader_position"
                    placeholder="Position"
                    class="h-8 text-sm"
                  />
                </div>

                <!-- Dept Head -->
                <div class="space-y-1.5">
                  <Label class="text-[10px] uppercase text-muted-foreground font-semibold"
                    >Dept Head</Label
                  >
                  <Input v-model="settings.dept_head_name" placeholder="Name" class="h-8 text-sm" />
                </div>
                <div class="space-y-1.5">
                  <Label class="text-[10px] uppercase text-muted-foreground font-semibold"
                    >Dept Head Position</Label
                  >
                  <Input
                    v-model="settings.dept_head_position"
                    placeholder="Position"
                    class="h-8 text-sm"
                  />
                </div>

                <!-- Div Head -->
                <div class="space-y-1.5">
                  <Label class="text-[10px] uppercase text-muted-foreground font-semibold"
                    >Division Head</Label
                  >
                  <Input v-model="settings.div_head_name" placeholder="Name" class="h-8 text-sm" />
                </div>
                <div class="space-y-1.5">
                  <Label class="text-[10px] uppercase text-muted-foreground font-semibold"
                    >Div Head Position</Label
                  >
                  <Input
                    v-model="settings.div_head_position"
                    placeholder="Position"
                    class="h-8 text-sm"
                  />
                </div>
              </div>
            </div>

            <!-- GitLab Section -->
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <div class="h-5 w-5 rounded bg-orange-500/10 flex items-center justify-center">
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
                    placeholder="https://gitlab-ce.brilife.co.id"
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
                    :disabled="fetchingProjects || !settings.gitlab_token"
                    class="h-6 text-[10px] gap-1"
                    @click="fetchProjects"
                  >
                    <RefreshCw class="h-3 w-3" :class="{ 'animate-spin': fetchingProjects }" />
                    Fetch List
                  </Button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  <div
                    v-if="!allProjects.length && !fetchingProjects"
                    class="col-span-full text-[10px] text-muted-foreground text-center py-4 border rounded-md bg-muted/20"
                  >
                    No projects fetched. Click "Fetch List".
                  </div>
                  <div
                    v-else-if="fetchingProjects"
                    class="col-span-full text-[10px] text-center py-4 border rounded-md bg-muted/20 animate-pulse"
                  >
                    Loading projects...
                  </div>
                  <Card
                    v-for="p in allProjects"
                    :key="p.id"
                    class="p-2 flex items-center gap-2 cursor-pointer transition-all hover:border-primary/50 hover:bg-accent/50 group relative focus-visible:ring-1 focus-visible:ring-primary outline-none"
                    :class="{
                      'border-primary/50 bg-primary/5 shadow-sm': selectedProjectIds.includes(p.id),
                    }"
                    tabindex="0"
                    @click="toggleProject(p.id)"
                    @keydown.enter.prevent="toggleProject(p.id)"
                    @keydown.space.prevent="toggleProject(p.id)"
                  >
                    <Checkbox
                      :model-value="selectedProjectIds.includes(p.id)"
                      class="h-4 w-4 pointer-events-none"
                    />
                    <div class="flex flex-col min-w-0">
                      <span class="text-[10px] font-semibold truncate leading-tight">{{
                        p.name
                      }}</span>
                      <span class="text-[9px] text-muted-foreground truncate leading-tight">{{
                        p.path
                      }}</span>
                    </div>
                  </Card>
                </div>
              </div>
            </div>

            <!-- Jira Section -->
            <div class="space-y-3 pt-2 border-t border-border/40">
              <div class="flex items-center gap-2">
                <div class="h-5 w-5 rounded bg-blue-600/10 flex items-center justify-center">
                  <Trello class="h-3 w-3 text-blue-600" />
                </div>
                <span class="text-sm font-medium">Jira (Atlassian)</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-7">
                <div class="space-y-1.5">
                  <Label class="text-xs">Jira Email</Label>
                  <Input
                    v-model="settings.jira_email"
                    placeholder="name@company.com"
                    class="h-9 text-sm"
                  />
                </div>
                <div class="space-y-1.5">
                  <Label class="text-xs">API Token</Label>
                  <Input
                    v-model="settings.jira_token"
                    type="password"
                    placeholder="Enter Jira API Token"
                    class="h-9 text-sm"
                  />
                </div>
                <div class="col-span-full space-y-1.5">
                  <Label class="text-xs">Instance URL</Label>
                  <Input
                    v-model="settings.jira_url"
                    placeholder="https://company.atlassian.net"
                    class="h-9 text-sm"
                  />
                </div>
              </div>
            </div>

            <!-- AI Section -->
            <div class="space-y-3 pt-2 border-t border-border/40">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="h-5 w-5 rounded bg-violet-500/10 flex items-center justify-center">
                    <Sparkles class="h-3 w-3 text-violet-500" />
                  </div>
                  <span class="text-sm font-medium">AI Configuration</span>
                </div>

                <Tabs
                  :model-value="settings.ai_provider"
                  class="w-auto"
                  @update:model-value="
                    (v) => {
                      settings.ai_provider = v as 'gemini' | 'openai' | 'ollama'
                      settings.ai_model =
                        v === 'gemini'
                          ? 'gemini-2.0-flash-lite'
                          : v === 'openai'
                            ? 'gpt-4o-mini'
                            : 'gemma:latest'
                    }
                  "
                >
                  <TabsList class="h-8">
                    <TabsTrigger value="gemini" class="text-[10px] px-3 h-7"> Gemini </TabsTrigger>
                    <TabsTrigger value="openai" class="text-[10px] px-3 h-7"> OpenAI </TabsTrigger>
                    <TabsTrigger value="ollama" class="text-[10px] px-3 h-7"> Ollama </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div class="space-y-3 pl-7">
                <!-- Model Selection -->
                <div class="space-y-1.5">
                  <Label class="text-xs">Model Selection</Label>
                  <Select v-model="settings.ai_model">
                    <SelectTrigger class="h-9 text-sm">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup v-if="settings.ai_provider === 'gemini'">
                        <SelectItem value="gemini-3.1-flash-lite-preview">
                          Gemini 3.1 Flash Lite Preview
                        </SelectItem>
                        <SelectItem value="gemini-2.5-flash-lite">
                          Gemini 2.5 Flash Lite
                        </SelectItem>
                        <SelectItem value="gemini-2.0-flash-lite">
                          Gemini 2.0 Flash Lite
                        </SelectItem>
                        <SelectItem value="gemini-1.5-flash"> Gemini 1.5 Flash </SelectItem>
                        <SelectItem value="gemini-1.5-pro"> Gemini 1.5 Pro </SelectItem>
                      </SelectGroup>
                      <SelectGroup v-else-if="settings.ai_provider === 'openai'">
                        <SelectItem value="gpt-4o-mini"> GPT-4o Mini </SelectItem>
                        <SelectItem value="gpt-4o"> GPT-4o </SelectItem>
                        <SelectItem value="gpt-3.5-turbo"> GPT-3.5 Turbo </SelectItem>
                      </SelectGroup>
                      <SelectGroup v-else-if="settings.ai_provider === 'ollama'">
                        <SelectItem v-for="m in ollamaModels" :key="m.name" :value="m.name">
                          {{ m.name }}
                        </SelectItem>
                        <SelectItem v-if="!ollamaModels.length" value="gemma:latest" disabled>
                          No models found
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div v-if="settings.ai_provider === 'gemini'" class="space-y-1.5">
                  <Label class="text-xs">Gemini API Key</Label>
                  <Input
                    v-model="settings.gemini_api_key"
                    type="password"
                    placeholder="Enter your Google AI API Key"
                    class="h-9 text-sm"
                  />
                  <p class="text-[10px] text-muted-foreground">
                    Google's high-speed AI for text processing.
                  </p>
                </div>

                <div v-else-if="settings.ai_provider === 'openai'" class="space-y-1.5">
                  <Label class="text-xs">OpenAI API Key</Label>
                  <Input
                    v-model="settings.openai_api_key"
                    type="password"
                    placeholder="sk-xxxxxxxxxxxxxxxx"
                    class="h-9 text-sm"
                  />
                  <p class="text-[10px] text-muted-foreground">
                    Standard industry provider for GPT models.
                  </p>
                </div>

                <div v-else-if="settings.ai_provider === 'ollama'" class="space-y-3">
                  <div class="space-y-1.5">
                    <Label class="text-xs">Ollama Base URL</Label>
                    <div class="flex gap-2">
                      <Input
                        v-model="settings.ollama_url"
                        placeholder="http://localhost:11434"
                        class="h-9 text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        :disabled="fetchingModels"
                        class="h-9 px-3"
                        @click="fetchOllamaModels"
                      >
                        <RefreshCw
                          class="h-3.5 w-3.5"
                          :class="{ 'animate-spin': fetchingModels }"
                        />
                      </Button>
                    </div>
                    <p class="text-[10px] text-muted-foreground">
                      The URL where your Ollama instance is running.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter class="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" @click="$emit('update:modelValue', false)"
              >Cancel</Button
            >
            <Button
              size="sm"
              :disabled="saving"
              class="gap-1.5 min-w-[100px]"
              @click="saveSettings"
            >
              <RefreshCw v-if="saving" class="h-3.5 w-3.5 animate-spin" />
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { Settings, RefreshCw, GitMerge, Sparkles, User, FileText, Trello } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Checkbox } from '~/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { useCoreStore } from '~/stores/core'
import { useGitlabStore } from '~/stores/gitlab'
import type { OllamaModel } from '~/types/ollama'

defineProps<{
  modelValue: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const coreStore = useCoreStore()
const gitlabStore = useGitlabStore()

const { saveSettings, toggleProject } = coreStore
const { fetchProjects } = gitlabStore

const { saving, settings, selectedProjectIds } = storeToRefs(coreStore)
const { fetchingProjects, allProjects } = storeToRefs(gitlabStore)
const ollamaModels = ref<OllamaModel[]>([])
const fetchingModels = ref(false)

async function fetchOllamaModels() {
  fetchingModels.value = true
  try {
    const { fetchOllamaModels: fetchModels } = await import('~/utils/ai')
    const models = await fetchModels(settings.value?.ollama_url || 'http://localhost:11434')
    ollamaModels.value = models
    // If current model is not in the list and list is not empty, select the first one
    if (
      ollamaModels.value.length > 0 &&
      settings.value &&
      !ollamaModels.value.find((m) => m.name === settings.value?.ai_model)
    ) {
      settings.value.ai_model = ollamaModels.value[0]!.name
    }
  } catch (err) {
    console.error('Failed to fetch Ollama models:', err)
  } finally {
    fetchingModels.value = false
  }
}

watch(
  () => settings.value?.ai_provider,
  (newVal) => {
    if (newVal === 'ollama' && ollamaModels.value.length === 0) {
      fetchOllamaModels()
    }
  },
)

onMounted(() => {
  fetchProjects()
  if (settings.value?.ai_provider === 'ollama') {
    fetchOllamaModels()
  }
})
</script>
