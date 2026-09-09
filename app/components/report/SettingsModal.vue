<template>
  <Dialog :open="modelValue" @update:open="$emit('update:modelValue', $event)">
    <DialogContent
      class="w-full max-w-2xl h-[95vh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col p-0 border-border/50 shadow-2xl"
    >
      <DialogHeader class="p-6 pb-0">
        <DialogTitle class="flex items-center gap-2 text-base">
          <Settings class="size-4 text-muted-foreground" />
          Settings
        </DialogTitle>
        <DialogDescription>
          API tokens are stored locally in your SQLite database.
        </DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        <!-- Profile Section -->
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <div class="size-5 rounded bg-blue-500/10 flex items-center justify-center">
              <User class="size-3 text-blue-500" />
            </div>
            <span class="text-sm font-medium">Profile Info</span>
          </div>

          <FieldGroup class="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-7">
            <Field>
              <FieldLabel class="text-xs">Full Name</FieldLabel>
              <Input
                v-model="settings.user_name"
                placeholder="Michael Johnson"
                class="h-9 text-sm"
              />
            </Field>
            <Field>
              <FieldLabel class="text-xs">Position</FieldLabel>
              <Input
                v-model="settings.user_position"
                placeholder="Staff IT Governance"
                class="h-9 text-sm"
              />
            </Field>
            <Field>
              <FieldLabel class="text-xs">Nopeg</FieldLabel>
              <Input
                v-model="settings.user_nopeg"
                placeholder="700012410952025"
                class="h-9 text-sm"
              />
            </Field>
            <Field>
              <FieldLabel class="text-xs">Unit Kerja</FieldLabel>
              <Input
                v-model="settings.user_unit"
                placeholder="Teknologi Informasi"
                class="h-9 text-sm"
              />
            </Field>
            <Field>
              <FieldLabel class="text-xs">Bagian / Fungsi Kerja</FieldLabel>
              <Input v-model="settings.user_function" placeholder="Developer" class="h-9 text-sm" />
            </Field>
          </FieldGroup>
        </div>

        <!-- Signatories Section -->
        <div class="space-y-3 pt-2 border-t border-border/40">
          <div class="flex items-center gap-2">
            <div class="size-5 rounded bg-emerald-500/10 flex items-center justify-center">
              <FileText class="size-3 text-emerald-500" />
            </div>
            <span class="text-sm font-medium">Document Signatories</span>
          </div>

          <FieldGroup class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 pl-7">
            <!-- Team Leader -->
            <Field>
              <FieldLabel class="text-[10px] uppercase text-muted-foreground font-semibold"
                >Team Leader</FieldLabel
              >
              <Input v-model="settings.team_leader_name" placeholder="Name" class="h-8 text-sm" />
            </Field>
            <Field>
              <FieldLabel class="text-[10px] uppercase text-muted-foreground font-semibold"
                >TL Position</FieldLabel
              >
              <Input
                v-model="settings.team_leader_position"
                placeholder="Position"
                class="h-8 text-sm"
              />
            </Field>

            <!-- Dept Head -->
            <Field>
              <FieldLabel class="text-[10px] uppercase text-muted-foreground font-semibold"
                >Dept Head</FieldLabel
              >
              <Input v-model="settings.dept_head_name" placeholder="Name" class="h-8 text-sm" />
            </Field>
            <Field>
              <FieldLabel class="text-[10px] uppercase text-muted-foreground font-semibold"
                >Dept Head Position</FieldLabel
              >
              <Input
                v-model="settings.dept_head_position"
                placeholder="Position"
                class="h-8 text-sm"
              />
            </Field>

            <!-- Div Head -->
            <Field>
              <FieldLabel class="text-[10px] uppercase text-muted-foreground font-semibold"
                >Division Head</FieldLabel
              >
              <Input v-model="settings.div_head_name" placeholder="Name" class="h-8 text-sm" />
            </Field>
            <Field>
              <FieldLabel class="text-[10px] uppercase text-muted-foreground font-semibold"
                >Div Head Position</FieldLabel
              >
              <Input
                v-model="settings.div_head_position"
                placeholder="Position"
                class="h-8 text-sm"
              />
            </Field>
          </FieldGroup>
        </div>

        <!-- GitLab Section -->
        <div class="space-y-3 pt-2 border-t border-border/40">
          <div class="flex items-center gap-2">
            <div class="size-5 rounded bg-orange-500/10 flex items-center justify-center">
              <GitMerge class="size-3 text-orange-500" />
            </div>
            <span class="text-sm font-medium">GitLab</span>
          </div>

          <FieldGroup class="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-7">
            <Field>
              <FieldLabel class="text-xs">Personal Access Token</FieldLabel>
              <Input
                v-model="settings.gitlab_token"
                type="password"
                placeholder="glpat-xxxxxxxxxxxx"
                class="h-9 text-sm"
              />
            </Field>
            <Field>
              <FieldLabel class="text-xs">Instance URL</FieldLabel>
              <Input
                v-model="settings.gitlab_url"
                placeholder="https://gitlab-ce.brilife.co.id"
                class="h-9 text-sm"
              />
            </Field>
          </FieldGroup>

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
                <RefreshCw :class="{ 'animate-spin': fetchingProjects }" data-icon="inline-start" />
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
                  class="size-4 pointer-events-none"
                />
                <div class="flex flex-col min-w-0">
                  <span class="text-[10px] font-semibold truncate leading-tight">{{ p.name }}</span>
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
            <div class="size-5 rounded bg-blue-600/10 flex items-center justify-center">
              <Trello class="size-3 text-blue-600" />
            </div>
            <span class="text-sm font-medium">Jira (Atlassian)</span>
          </div>

          <FieldGroup class="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-7">
            <Field>
              <FieldLabel class="text-xs">Jira Email</FieldLabel>
              <Input
                v-model="settings.jira_email"
                placeholder="name@company.com"
                class="h-9 text-sm"
              />
            </Field>
            <Field>
              <FieldLabel class="text-xs">API Token</FieldLabel>
              <Input
                v-model="settings.jira_token"
                type="password"
                placeholder="Enter Jira API Token"
                class="h-9 text-sm"
              />
            </Field>
            <Field class="col-span-full">
              <FieldLabel class="text-xs">Instance URL</FieldLabel>
              <Input
                v-model="settings.jira_url"
                placeholder="https://company.atlassian.net"
                class="h-9 text-sm"
              />
            </Field>
          </FieldGroup>

          <div class="space-y-2 pt-2 pl-7">
            <div class="flex items-center justify-between">
              <Label class="text-xs">Allowed Projects</Label>
              <div class="flex gap-1">
                <Input
                  v-model="jiraProjectInput"
                  placeholder="e.g. DIGITAL"
                  class="h-7 text-[10px] w-28 font-mono uppercase"
                  @keydown.enter.prevent="addJiraProject"
                />
                <Button
                  size="sm"
                  variant="outline"
                  class="h-7 text-[10px] px-2"
                  :disabled="!jiraProjectInput.trim()"
                  @click="addJiraProject"
                >
                  Add
                </Button>
              </div>
            </div>

            <div class="flex flex-wrap gap-1.5">
              <div
                v-if="!selectedJiraProjects.length"
                class="text-[10px] text-muted-foreground text-center py-2 w-full border rounded-md bg-muted/20"
              >
                No projects configured. Add project keys above.
              </div>
              <Badge
                v-for="key in selectedJiraProjects"
                :key="key"
                variant="secondary"
                class="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[9px] px-2 py-1 gap-1 cursor-pointer hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/20 transition-colors"
                @click="coreStore.toggleJiraProject(key)"
              >
                {{ key }}
                <X class="size-2.5" />
              </Badge>
            </div>
          </div>
        </div>

        <!-- AI Section -->
        <div class="space-y-3 pt-2 border-t border-border/40">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="size-5 rounded bg-violet-500/10 flex items-center justify-center">
                <Sparkles class="size-3 text-violet-500" />
              </div>
              <span class="text-sm font-medium">AI Configuration</span>
            </div>

            <Tabs
              :model-value="settings.ai_provider"
              class="w-auto"
              @update:model-value="onProviderChange"
            >
              <TabsList class="h-8">
                <TabsTrigger value="gemini" class="text-[10px] px-3 h-7"> Gemini </TabsTrigger>
                <TabsTrigger value="openai" class="text-[10px] px-3 h-7"> OpenAI </TabsTrigger>
                <TabsTrigger value="ollama" class="text-[10px] px-3 h-7"> Ollama </TabsTrigger>
                <TabsTrigger value="deepseek" class="text-[10px] px-3 h-7"> DeepSeek </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <FieldGroup class="space-y-3 pl-7">
            <!-- Model Selection -->
            <Field>
              <FieldLabel class="text-xs">Model Selection</FieldLabel>
              <Select v-model="settings.ai_model">
                <SelectTrigger class="h-9 text-sm">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <template v-if="settings.ai_provider === 'gemini'">
                      <SelectItem value="gemini-2.0-flash-lite">
                        Gemini 2.0 Flash Lite (Free & Fast)
                      </SelectItem>
                      <SelectItem value="gemini-2.5-flash-lite"> Gemini 2.5 Flash Lite </SelectItem>
                      <SelectItem value="gemini-3.1-flash-lite-preview">
                        Gemini 3.1 Flash Lite Preview
                      </SelectItem>
                      <SelectItem value="gemini-1.5-flash"> Gemini 1.5 Flash </SelectItem>
                      <SelectItem value="gemini-1.5-pro"> Gemini 1.5 Pro </SelectItem>
                    </template>
                    <template v-else-if="settings.ai_provider === 'openai'">
                      <SelectItem value="gpt-4o-mini"> GPT-4o Mini </SelectItem>
                      <SelectItem value="gpt-4o"> GPT-4o </SelectItem>
                      <SelectItem value="gpt-3.5-turbo"> GPT-3.5 Turbo </SelectItem>
                    </template>
                    <template v-else-if="settings.ai_provider === 'deepseek'">
                      <SelectItem value="deepseek-v4-flash"> DeepSeek v4 Flash (Fast) </SelectItem>
                      <SelectItem value="deepseek-v4-pro"> DeepSeek v4 Pro </SelectItem>
                      <SelectItem value="deepseek-chat"> DeepSeek Chat (V3) </SelectItem>
                      <SelectItem value="deepseek-reasoner"> DeepSeek Reasoner (R1) </SelectItem>
                    </template>

                    <template v-else-if="settings.ai_provider === 'ollama'">
                      <SelectItem v-for="m in ollamaModels" :key="m.name" :value="m.name">
                        {{ m.name }}
                      </SelectItem>
                    </template>
                  </SelectGroup>
                  <SelectGroup v-if="settings.ai_provider === 'ollama' && !ollamaModels.length">
                    <SelectItem value="gemma:latest" disabled> No models found </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field v-if="settings.ai_provider === 'gemini'">
              <div class="flex items-center justify-between">
                <FieldLabel class="text-xs">Gemini API Key</FieldLabel>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  class="text-[10px] text-violet-500 hover:underline inline-flex items-center gap-1"
                >
                  Get Free Key (aistudio.google.com)
                  <ExternalLink class="size-2.5" />
                </a>
              </div>
              <Input
                v-model="settings.gemini_api_key"
                type="password"
                placeholder="Enter your Google AI API Key"
                class="h-9 text-sm"
              />
              <FieldDescription>
                100% free tier (15 RPM / 1,500 RPD) with Google AI Studio.
              </FieldDescription>
            </Field>

            <Field v-else-if="settings.ai_provider === 'openai'">
              <FieldLabel class="text-xs">OpenAI API Key</FieldLabel>
              <Input
                v-model="settings.openai_api_key"
                type="password"
                placeholder="sk-xxxxxxxxxxxxxxxx"
                class="h-9 text-sm"
              />
              <FieldDescription> Standard industry provider for GPT models. </FieldDescription>
            </Field>

            <Field v-else-if="settings.ai_provider === 'deepseek'">
              <FieldLabel class="text-xs">DeepSeek API Key</FieldLabel>
              <Input
                v-model="settings.deepseek_api_key"
                type="password"
                placeholder="sk-xxxxxxxxxxxxxxxx"
                class="h-9 text-sm"
              />
              <FieldDescription>
                DeepSeek's cost-efficient AI for text processing.
              </FieldDescription>
            </Field>

            <Field v-else-if="settings.ai_provider === 'ollama'">
              <FieldLabel class="text-xs">Ollama Base URL</FieldLabel>
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
                  <RefreshCw :class="{ 'animate-spin': fetchingModels }" data-icon="inline-start" />
                </Button>
              </div>
              <FieldDescription> The URL where your Ollama instance is running. </FieldDescription>
            </Field>
          </FieldGroup>
        </div>
      </div>

      <DialogFooter class="flex justify-end gap-2 border-t border-border/40 bg-muted/5 p-4">
        <Button variant="ghost" size="sm" @click="$emit('update:modelValue', false)">Cancel</Button>
        <Button size="sm" :disabled="saving" class="gap-1.5 min-w-[100px]" @click="saveSettings">
          <RefreshCw v-if="saving" class="animate-spin" data-icon="inline-start" />
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import {
  Settings,
  RefreshCw,
  GitMerge,
  Sparkles,
  User,
  FileText,
  Trello,
  X,
  ExternalLink,
} from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '~/components/ui/field'
import { Card } from '~/components/ui/card'
import { Label } from '~/components/ui/label'
import { Input } from '~/components/ui/input'
import { Checkbox } from '~/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
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

const { saving, settings, selectedProjectIds, selectedJiraProjects } = storeToRefs(coreStore)
const { fetchingProjects, allProjects } = storeToRefs(gitlabStore)
const ollamaModels = ref<OllamaModel[]>([])
const fetchingModels = ref(false)
const jiraProjectInput = ref('')

function addJiraProject() {
  const key = jiraProjectInput.value.trim().toUpperCase()
  if (key && !selectedJiraProjects.value.includes(key)) {
    selectedJiraProjects.value.push(key)
  }
  jiraProjectInput.value = ''
}

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

function onProviderChange(v: string | number) {
  settings.value!.ai_provider = v as 'gemini' | 'openai' | 'ollama' | 'deepseek'
  settings.value!.ai_model =
    v === 'gemini'
      ? 'gemini-2.0-flash-lite'
      : v === 'openai'
        ? 'gpt-4o-mini'
        : v === 'deepseek'
          ? 'deepseek-chat'
          : 'gemma:latest'
}

onMounted(() => {
  if (settings.value?.gitlab_token) fetchProjects()
  if (settings.value?.ai_provider === 'ollama') fetchOllamaModels()
})
</script>
