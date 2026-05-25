<template>
  <Dialog :open="modelValue" @update:open="closeModal">
    <DialogContent
      class="w-full max-w-5xl lg:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-blue-500/20 shadow-2xl"
    >
      <DialogHeader class="border-b border-border/40 bg-muted/10 p-6">
        <DialogTitle class="flex items-center gap-2 text-base">
          <div class="size-8 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Trello class="size-4 text-blue-500 animate-pulse" />
          </div>
          Push to Jira
        </DialogTitle>
        <DialogDescription>Export Monthly Task as a Jira Issue</DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto p-6">
        <!-- Loading Configuration State -->
        <div v-if="loadingConfig" class="flex flex-col items-center justify-center py-12 gap-3">
          <RefreshCw class="size-8 text-blue-500 animate-spin" />
          <p class="text-sm text-muted-foreground font-medium">Fetching Jira information...</p>
        </div>

        <!-- Configuration Error State -->
        <div v-else-if="configError" class="space-y-4 py-4 text-center">
          <div
            class="mx-auto size-12 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center text-red-600 dark:text-red-400"
          >
            <AlertCircle class="size-6" />
          </div>
          <div class="space-y-1.5">
            <h3 class="text-sm font-bold text-foreground">Jira Integration Incomplete</h3>
            <p class="text-xs text-muted-foreground px-4">
              Please configure your Jira credentials (URL, Email, and API Token) in Settings before
              pushing tasks.
            </p>
          </div>
          <Button size="sm" variant="outline" @click="openSettings">
            <Settings data-icon="inline-start" />
            Go to Settings
          </Button>
        </div>

        <!-- Success State -->
        <div
          v-else-if="successIssue"
          class="space-y-6 py-6 text-center animate-in fade-in zoom-in-95 duration-200"
        >
          <div
            class="mx-auto size-12 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400"
          >
            <CheckCircle2 class="size-6" />
          </div>
          <div class="space-y-2">
            <h3 class="text-base font-bold text-foreground">Jira Issue Created!</h3>
            <p class="text-xs text-muted-foreground">
              Task has been successfully logged under project.
            </p>
            <div
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-sm font-bold"
            >
              {{ successIssue.key }}
            </div>
          </div>
          <div class="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <Button size="sm" variant="outline" @click="closeModal">Close Dialog</Button>
            <Button
              as="a"
              :href="successIssue.webUrl"
              target="_blank"
              rel="noopener noreferrer"
              variant="gradient"
              size="xs"
            >
              View in Jira
              <ExternalLink data-icon="inline-end" />
            </Button>
          </div>
        </div>

        <!-- Form State -->
        <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <!-- Left Column: Jira Fields Form -->
          <FieldGroup class="space-y-4 lg:col-span-5">
            <!-- Project and Issue Type Side-by-Side -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Target Project -->
              <Field>
                <FieldLabel class="text-xs font-bold text-muted-foreground uppercase tracking-wide"
                  >Jira Project</FieldLabel
                >
                <Select v-model="selectedProjectKey">
                  <SelectTrigger class="h-9 text-xs">
                    <SelectValue placeholder="Select Jira Project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem v-for="proj in projects" :key="proj.id" :value="proj.key">
                        [{{ proj.key }}] {{ proj.name }}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <!-- Issue Type -->
              <Field>
                <FieldLabel class="text-xs font-bold text-muted-foreground uppercase tracking-wide"
                  >Issue Type</FieldLabel
                >
                <Select v-model="selectedIssueTypeId">
                  <SelectTrigger class="h-9 text-xs">
                    <SelectValue placeholder="Select Issue Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem v-for="type in issueTypes" :key="type.id" :value="type.id">
                        {{ type.name }}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <!-- Parent Issue & Custom Parent Key Grid -->
            <div
              class="grid grid-cols-1 gap-4"
              :class="{ 'sm:grid-cols-2': parentSelectionType === 'custom' }"
            >
              <!-- Parent Issue -->
              <Field>
                <FieldLabel
                  class="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1"
                >
                  Parent Issue
                  <span class="text-[9px] lowercase font-normal text-muted-foreground"
                    >(optional)</span
                  >
                </FieldLabel>
                <Select v-model="parentSelectionType">
                  <SelectTrigger class="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Parent</SelectItem>
                    <SelectItem value="custom">Custom Parent Key...</SelectItem>
                    <SelectGroup v-if="candidateParents.length">
                      <SelectLabel
                        class="text-[9px] uppercase tracking-wide text-muted-foreground/60 px-2 py-1 font-bold"
                        >Candidates from Daily Activity</SelectLabel
                      >
                      <SelectItem v-for="p in candidateParents" :key="p.id" :value="p.key">
                        [{{ p.key }}] {{ p.summary }}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <!-- Custom Parent Key Input -->
              <Field
                v-if="parentSelectionType === 'custom'"
                class="animate-in fade-in duration-200"
              >
                <FieldLabel
                  class="text-[10px] font-bold text-muted-foreground uppercase tracking-wide"
                  >Custom Parent Key</FieldLabel
                >
                <Input
                  v-model="customParentKey"
                  placeholder="e.g. PROJ-123"
                  class="h-9 text-xs font-mono uppercase"
                />
              </Field>
            </div>

            <!-- Issue Summary -->
            <Field>
              <FieldLabel class="text-xs font-bold text-muted-foreground uppercase tracking-wide"
                >Issue Summary</FieldLabel
              >
              <Input
                v-model="issueSummary"
                placeholder="Summary title of the issue"
                class="h-9 text-xs"
              />
            </Field>
          </FieldGroup>

          <!-- Right Column: Task Details Preview & Child Subtasks Selection -->
          <div class="space-y-4 lg:col-span-7">
            <!-- Task Details Preview -->
            <div class="p-3.5 rounded-xl border border-muted bg-muted/20 space-y-1.5">
              <div
                class="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
              >
                <span>Selected Task Row</span>
                <Badge
                  variant="secondary"
                  class="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 text-[9px] px-1.5"
                >
                  {{ exportRow?.progres || '100%' }} done
                </Badge>
              </div>
              <p class="text-sm font-semibold text-foreground leading-snug">
                {{ exportRow?.project }}
              </p>
              <div
                v-if="exportRow?.sources?.length"
                class="text-[10px] text-muted-foreground flex items-center gap-1"
              >
                <CalendarDays class="size-3 shrink-0 text-indigo-500" />
                Summarized from {{ exportRow.sources.length }} active dates:
                <span class="font-mono text-foreground">{{ exportRow.sources.join(', ') }}</span>
              </div>
            </div>

            <!-- Child Subtasks Selection -->
            <FieldSet
              v-if="displayActivities && displayActivities.length"
              class="space-y-2 border-t border-border/40 pt-3"
            >
              <div class="flex items-center justify-between gap-2">
                <FieldLegend
                  class="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5"
                >
                  <ListTodo class="size-3.5 text-blue-500" />
                  Create Child Subtasks
                  <span class="text-[9px] lowercase font-normal text-muted-foreground"
                    >(from daily activities)</span
                  >
                </FieldLegend>

                <!-- AI Group & Summarize Button -->
                <Button
                  v-if="coreStore.isAiEnabled"
                  variant="outline"
                  size="sm"
                  class="h-7 text-[10px] font-semibold gap-1 px-2 border-purple-500/30 text-purple-600 hover:text-purple-700 hover:bg-purple-50/50 dark:text-purple-400 dark:border-purple-500/20 dark:hover:bg-purple-950/20 cursor-pointer"
                  :disabled="isAILoading || !selectedSubtasks.length"
                  @click="groupSubtasksWithAI"
                >
                  <Sparkles v-if="!isAILoading" class="text-purple-500" data-icon="inline-start" />
                  <RefreshCw v-else class="animate-spin text-purple-500" data-icon="inline-start" />
                  {{ isAILoading ? 'AI Summarizing...' : 'AI Group & Summarize' }}
                </Button>
                <span
                  v-else
                  class="text-[9px] text-muted-foreground italic flex items-center gap-0.5"
                >
                  AI disabled (no API keys)
                </span>
              </div>

              <FieldGroup
                class="space-y-1.5 max-h-72 overflow-y-auto border border-border/50 rounded-lg p-3 bg-muted/5"
              >
                <Field
                  v-for="(act, idx) in displayActivities"
                  :key="idx"
                  orientation="horizontal"
                  class="flex items-start gap-2.5 p-1.5 rounded-md hover:bg-muted/10 transition-colors"
                >
                  <Checkbox
                    :id="'subtask-' + idx"
                    :checked="selectedSubtasks.includes(act)"
                    class="mt-0.5"
                    @update:checked="
                      (checked: boolean) => {
                        if (checked) {
                          selectedSubtasks.push(act)
                        } else {
                          selectedSubtasks = selectedSubtasks.filter((x) => x !== act)
                        }
                      }
                    "
                  />
                  <FieldLabel
                    :for="'subtask-' + idx"
                    class="text-xs font-medium text-foreground cursor-pointer select-none leading-normal"
                  >
                    {{ act }}
                  </FieldLabel>
                </Field>
              </FieldGroup>
            </FieldSet>
          </div>
        </div>
      </div>

      <DialogFooter
        v-if="!successIssue && !configError && !loadingConfig"
        class="flex justify-end gap-2 border-t border-border/40 bg-muted/5 p-4"
      >
        <Button variant="ghost" size="sm" :disabled="creating" @click="closeModal">Cancel</Button>
        <Button
          size="sm"
          :disabled="
            creating || !selectedProjectKey || !selectedIssueTypeId || !issueSummary.trim()
          "
          class="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 min-w-[120px]"
          @click="submitJiraIssue"
        >
          <RefreshCw v-if="creating" class="animate-spin" data-icon="inline-start" />
          {{ creating ? 'Creating...' : 'Create Issue' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import {
  Trello,
  RefreshCw,
  AlertCircle,
  Settings,
  CheckCircle2,
  ExternalLink,
  CalendarDays,
  ListTodo,
  Sparkles,
} from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Field, FieldGroup, FieldLabel, FieldSet, FieldLegend } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Checkbox } from '~/components/ui/checkbox'
import { Badge } from '~/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '~/components/ui/select'
import { storeToRefs } from 'pinia'
import { useJiraStore } from '~/stores/jira'
import { useCoreStore } from '~/stores/core'
import { useToast } from '~/composables/use-toast'
import { getJiraConfig, createJiraIssue, buildAdfRowDescription } from '~/utils/jira'
import type { JiraConfig } from '~/utils/jira'
import { generateSummary } from '~/utils/ai'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const jiraStore = useJiraStore()
const coreStore = useCoreStore()
const { success, error } = useToast()

const { exportRow, exportPeriod, candidateParents } = storeToRefs(jiraStore)
const exportRowActivities = computed(() => jiraStore.exportRowActivities || [])

const subtaskTypes = computed(() => (jiraStore.cachedIssueTypes || []).filter((t) => t.subtask))
const selectedSubtasks = ref<string[]>([])
const displayActivities = ref<string[]>([])
const myselfAccount = computed(() => jiraStore.cachedMyself)
const isAILoading = ref(false)

const loadingConfig = ref(true)
const configError = ref(false)
const creating = ref(false)

const projects = computed(() => {
  const allowedKeys = coreStore.selectedJiraProjects
  return allowedKeys.length
    ? (jiraStore.cachedProjects || []).filter((p) => allowedKeys.includes(p.key))
    : jiraStore.cachedProjects || []
})

const issueTypes = computed(() => {
  const seen = new Set<string>()
  return (jiraStore.cachedIssueTypes || []).filter((t) => {
    if (t.subtask || seen.has(t.name)) return false
    seen.add(t.name)
    return true
  })
})

// Form models
const selectedProjectKey = ref('')
const selectedIssueTypeId = ref('')
const parentSelectionType = ref('none') // 'none' | 'custom' | '[parentKey]'
const customParentKey = ref('')
const issueSummary = ref('')

const successIssue = ref<{ key: string; webUrl: string } | null>(null)
let jiraConfigData: JiraConfig | null = null

async function loadJiraConfig() {
  loadingConfig.value = true
  configError.value = false
  successIssue.value = null

  try {
    const config = await getJiraConfig()
    if (!config || !config.baseUrl || !config.email || !config.token) {
      configError.value = true
      loadingConfig.value = false
      return
    }
    jiraConfigData = config

    // Pre-select project and summary based on bracket prefix: [PROJECT] Task description
    let parsedSummary = exportRow.value?.project || ''
    let matchedProjectKey = ''

    if (parsedSummary) {
      const match = parsedSummary.match(/^\[([^\]]+)\]\s*(.+)$/)
      if (match) {
        matchedProjectKey = match[1] || ''
        parsedSummary = match[2] || ''
      }
    }

    issueSummary.value = parsedSummary

    // Load projects, myself, and issue types using Pinia caching action
    await jiraStore.loadJiraMetadata(config)

    if (!projects.value.length) {
      loadingConfig.value = false
      return
    }

    // Determine target project
    const foundProject = projects.value.find(
      (p) =>
        p.key.toLowerCase() === matchedProjectKey.toLowerCase() ||
        p.name.toLowerCase().includes(matchedProjectKey.toLowerCase()),
    )

    if (foundProject) {
      selectedProjectKey.value = foundProject.key
    } else {
      const defaultProj = coreStore.settings.jira_default_project
      if (defaultProj && projects.value.some((p) => p.key === defaultProj)) {
        selectedProjectKey.value = defaultProj
      } else if (projects.value[0]) {
        selectedProjectKey.value = projects.value[0].key
      }
    }

    displayActivities.value = [...(exportRowActivities.value || [])]
    selectedSubtasks.value = [...(exportRowActivities.value || [])]

    // Default issue type selection
    const defaultType = coreStore.settings.jira_default_issuetype
    if (defaultType && issueTypes.value.some((t) => t.id === defaultType)) {
      selectedIssueTypeId.value = defaultType
    } else {
      const taskType = issueTypes.value.find(
        (t) => t.name.toLowerCase() === 'task' || t.name.toLowerCase() === 'story',
      )
      if (taskType) {
        selectedIssueTypeId.value = taskType.id
      } else if (issueTypes.value.length > 0 && issueTypes.value[0]) {
        selectedIssueTypeId.value = issueTypes.value[0].id
      }
    }

    // Detect candidate parent default selection
    if (candidateParents.value.length > 0 && candidateParents.value[0]) {
      parentSelectionType.value = candidateParents.value[0].key
    } else {
      parentSelectionType.value = 'none'
    }
  } catch (err) {
    console.error('Failed to load Jira data:', err)
    configError.value = true
  } finally {
    loadingConfig.value = false
  }
}

async function submitJiraIssue() {
  if (!jiraConfigData || !exportRow.value) return
  creating.value = true

  try {
    // Save defaults to store settings so they carry over
    coreStore.settings.jira_default_project = selectedProjectKey.value
    coreStore.settings.jira_default_issuetype = selectedIssueTypeId.value
    const saved = await coreStore.saveSettings()
    if (!saved) {
      error('Failed to save default settings')
      return
    }

    // Determine parent key
    let parentKey = ''
    if (parentSelectionType.value === 'custom') {
      parentKey = customParentKey.value.trim().toUpperCase()
    } else if (parentSelectionType.value !== 'none') {
      parentKey = parentSelectionType.value
    }

    // Build ADF description
    const adfDescription = await buildAdfRowDescription(
      exportRow.value,
      coreStore.settings,
      exportPeriod.value,
    )

    const payload: Parameters<typeof createJiraIssue>[1] = {
      fields: {
        project: { key: selectedProjectKey.value },
        summary: issueSummary.value.trim(),
        issuetype: { id: selectedIssueTypeId.value },
        description: adfDescription,
      },
    }

    if (myselfAccount.value?.accountId) {
      payload.fields.assignee = { id: myselfAccount.value.accountId }
    }

    // If parent is selected, inject parent field
    if (parentKey) {
      payload.fields.parent = { key: parentKey }

      // If parent is present and issue type is a subtask, or we need to switch type:
      // Note: standard JIRA requires subtask type to use parent link.
      // If they selected a parent but selected a standard task type, Jira Cloud standard hierarchy
      // allows it depending on configuration, otherwise it may throw error. We pass it as-is.
    }

    const res = await createJiraIssue(jiraConfigData, payload)

    // Create child subtasks under the newly created parent issue
    if (selectedSubtasks.value.length > 0) {
      const subtaskTypeId = subtaskTypes.value[0]?.id
      if (subtaskTypeId) {
        for (const subtaskSummary of selectedSubtasks.value) {
          try {
            const subtaskPayload: Parameters<typeof createJiraIssue>[1] = {
              fields: {
                project: { key: selectedProjectKey.value },
                summary: subtaskSummary,
                issuetype: { id: subtaskTypeId },
                parent: { key: res.key },
              },
            }
            if (myselfAccount.value?.accountId) {
              subtaskPayload.fields.assignee = { id: myselfAccount.value.accountId }
            }
            await createJiraIssue(jiraConfigData, subtaskPayload)
          } catch (subErr) {
            console.error(`Failed to create subtask: ${subtaskSummary}`, subErr)
          }
        }
      }
    }

    successIssue.value = {
      key: res.key,
      webUrl: `${jiraConfigData.baseUrl.replace(/\/$/, '')}/browse/${res.key}`,
    }
    success(`Jira issue ${res.key} created successfully!`)
  } catch (err: unknown) {
    console.error('Failed to create Jira issue:', err)
    const errMsg = err instanceof Error ? err.message : String(err)
    error(errMsg || 'Failed to create Jira issue')
  } finally {
    creating.value = false
  }
}

async function groupSubtasksWithAI() {
  if (!selectedSubtasks.value.length || isAILoading.value) return
  isAILoading.value = true

  try {
    const prompt = `You are a professional software project manager and Jira expert.
The user is exporting a monthly activity report row to Jira as a parent task.
Parent Task Summary: "${issueSummary.value || exportRow.value?.project || ''}"

Here is a list of raw, detailed daily developer activities:
${selectedSubtasks.value.map((act) => `- ${act}`).join('\n')}

Please group, clean up, and consolidate these raw activities into a clean, professional, and concise list of child subtasks (aim for 3-7 items depending on complexity).
Additionally, you MUST filter out and completely exclude any activities that are not related to the topic of the Parent Task Summary.

IMPORTANT Requirements:
1. Respond ONLY with a valid JSON array of strings, for example: ["Consolidated task 1", "Consolidated task 2"]
2. Do not wrap the JSON in markdown code blocks like \`\`\`json.
3. Do not write any other explanation, introduction, headers, or commentary.`

    const response = await generateSummary(prompt, { temperature: 0.2 })
    let cleanText = response.trim()
    if (cleanText.startsWith('```')) {
      const match = cleanText.match(/^(?:```[a-zA-Z]*\n?)([\s\S]*?)(?:\n?```)$/)
      if (match) {
        cleanText = (match[1] || '').trim()
      }
    }

    let parsed: string[] = []
    try {
      const json = JSON.parse(cleanText)
      if (Array.isArray(json)) {
        parsed = json.map((item) => String(item).trim()).filter(Boolean)
      }
    } catch {
      // Fallback: split by lines and strip bullets
      parsed = cleanText
        .split('\n')
        .map((line) => line.replace(/^[-*•\d.\s]+/, '').trim())
        .filter((line) => line.length > 2)
    }

    if (parsed.length > 0) {
      displayActivities.value = parsed
      selectedSubtasks.value = [...parsed]
      success('AI grouped and filtered subtasks successfully!')
    } else {
      error('AI did not return any valid subtasks.')
    }
  } catch (err: unknown) {
    console.error('Failed to group subtasks with AI:', err)
    const errMsg = err instanceof Error ? err.message : String(err)
    error(errMsg || 'Failed to group subtasks with AI')
  } finally {
    isAILoading.value = false
  }
}

function closeModal() {
  emit('update:modelValue', false)
}

function openSettings() {
  closeModal()
  coreStore.showSettings = true
}

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      loadJiraConfig()
    }
  },
  { immediate: true },
)
</script>
