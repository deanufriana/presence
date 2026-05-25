<template>
  <Dialog :open="modelValue" @update:open="closeModal">
    <DialogContent
      class="w-full max-w-5xl lg:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-blue-500/20 shadow-2xl"
      @keydown.ctrl.enter.prevent="submitJiraIssue"
      @keydown.meta.enter.prevent="submitJiraIssue"
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

            <!-- Issue Description -->
            <Field>
              <div class="flex items-center justify-between mb-1.5">
                <FieldLabel
                  class="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5"
                >
                  <FileText class="h-3.5 w-3.5 text-muted-foreground" />
                  Description
                  <span class="text-[9px] lowercase font-normal">(optional)</span>
                </FieldLabel>
                <Button
                  v-if="coreStore.isAiEnabled"
                  variant="ghost"
                  size="sm"
                  class="h-6 text-[10px] font-semibold gap-1 px-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50/50 dark:text-purple-400 dark:hover:bg-purple-950/20"
                  :disabled="isDescriptionLoading || !issueSummary.trim()"
                  @click="generateParentDescription"
                >
                  <Sparkles v-if="!isDescriptionLoading" class="h-3 w-3 text-purple-500" />
                  <RefreshCw v-else class="h-3 w-3 animate-spin text-purple-500" />
                  {{ isDescriptionLoading ? 'Generating...' : 'AI Generate' }}
                </Button>
              </div>
              <Textarea
                v-model="issueDescription"
                placeholder="Describe this issue... or click AI Generate to auto-fill based on summary."
                class="text-xs min-h-[80px] resize-none"
              />
            </Field>
          </FieldGroup>

          <!-- Right Column: Task Details Preview & Child Subtasks Selection -->
          <div class="space-y-4 lg:col-span-7">
            <!-- Child Subtasks Selection -->
            <JiraChildTaskList
              v-if="displayActivities.length"
              :tasks="displayActivities"
              :selected-ids="selectedSubtaskIds"
              :ai-enabled="coreStore.isAiEnabled"
              :ai-loading="isAILoading"
              @toggle="handleSubtaskToggle"
              @change-title="handleSubtaskTitleUpdate"
              @change-description="handleSubtaskDescriptionUpdate"
              @group-with-ai="groupSubtasksWithAI"
            />
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
  Sparkles,
  FileText,
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
import { Field, FieldGroup, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Badge } from '~/components/ui/badge'
import JiraChildTaskList from '~/components/report/JiraChildTaskList.vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '~/components/ui/select'
import type { JiraChildTask } from '~/types/report'
import type { JiraConfig as JiraApiConfig } from '~/utils/jira'
import { storeToRefs } from 'pinia'
import { useJiraStore } from '~/stores/jira'
import { useCoreStore } from '~/stores/core'
import { useToast } from '~/composables/use-toast'
import { getJiraConfig, createJiraIssue, buildAdfRowDescription } from '~/utils/jira'
import { generateSummary, parseAiJsonResponse } from '~/utils/ai'
import { generateId, parseProjectText } from '~/utils/format'
import { getJiraGroupSubtasksPrompt, getJiraParentDescriptionPrompt } from '~/utils/prompts'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const jiraStore = useJiraStore()
const coreStore = useCoreStore()
const { success, error } = useToast()

const {
  exportRow,
  exportPeriod,
  candidateParents,
  exportChildTasks,
  exportDescription,
  exportProjectKey,
} = storeToRefs(jiraStore)
const exportRowActivities = computed(() => jiraStore.exportRowActivities || [])

const subtaskTypes = computed(() => (jiraStore.cachedIssueTypes || []).filter((t) => t.subtask))
const selectedSubtaskIds = ref<string[]>([])
const displayActivities = ref<JiraChildTask[]>([])
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
const issueDescription = ref('')
const isDescriptionLoading = ref(false)

const successIssue = ref<{ key: string; webUrl: string } | null>(null)
let jiraConfigData: JiraApiConfig | null = null

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

    // Use store's pre-extracted project key; parse summary from bracket prefix
    issueSummary.value = parseProjectText(exportRow.value?.project || '').summary

    // Load projects, myself, and issue types using Pinia caching action
    await jiraStore.loadJiraMetadata(config)

    if (!projects.value.length) {
      loadingConfig.value = false
      return
    }

    // Determine target project using store's pre-extracted project key
    const foundProject = exportProjectKey.value
      ? projects.value.find(
          (p) =>
            p.key.toLowerCase() === exportProjectKey.value.toLowerCase() ||
            p.name.toLowerCase().includes(exportProjectKey.value.toLowerCase()),
        )
      : null

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

    // Pre-fill description from stored Jira export data
    issueDescription.value = exportDescription.value || ''

    // Pre-fill child tasks from stored Jira export data, fallback to raw activities
    if (exportChildTasks.value?.length) {
      displayActivities.value = exportChildTasks.value.map((t) => ({
        id: t.id || generateId(),
        title: t.title,
        description: t.description || '',
      }))
      selectedSubtaskIds.value = displayActivities.value.map((t) => t.id || '').filter(Boolean)
    } else {
      displayActivities.value = (exportRowActivities.value || []).map((a) => ({
        id: generateId(),
        title: a,
        description: '',
      }))
      selectedSubtaskIds.value = displayActivities.value.map((t) => t.id || '').filter(Boolean)
    }

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

  // Auto-generate description if AI is enabled and description is empty
  if (
    coreStore.isAiEnabled &&
    issueSummary.value.trim() &&
    !issueDescription.value.trim() &&
    !isDescriptionLoading.value
  ) {
    generateParentDescription()
  }
}

async function submitJiraIssue() {
  if (!jiraConfigData || !exportRow.value) return
  creating.value = true

  // Save current edits to local DB before creating Jira issue
  saveJiraExportData()

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

    // Build ADF description – merge BAST table with optional user-provided text
    const adfDescription = await buildAdfRowDescription(
      exportRow.value,
      coreStore.settings,
      exportPeriod.value,
      issueDescription.value.trim() || undefined,
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
    if (selectedSubtaskIds.value.length > 0) {
      const subtaskTypeId = subtaskTypes.value[0]?.id
      if (subtaskTypeId) {
        const selectedTasks = displayActivities.value.filter((t) =>
          selectedSubtaskIds.value.includes(t.id || ''),
        )
        for (const childTask of selectedTasks) {
          try {
            const fields: Record<string, unknown> = {
              project: { key: selectedProjectKey.value },
              summary: childTask.title,
              issuetype: { id: subtaskTypeId },
              parent: { key: res.key },
            }
            if (childTask.description) {
              fields.description = {
                type: 'doc',
                version: 1,
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: childTask.description }],
                  },
                ],
              }
            }
            if (myselfAccount.value?.accountId) {
              fields.assignee = { id: myselfAccount.value.accountId }
            }
            await createJiraIssue(jiraConfigData, {
              fields: fields as Parameters<typeof createJiraIssue>[1]['fields'],
            })
          } catch (subErr) {
            console.error(`Failed to create subtask: ${childTask.title}`, subErr)
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

function handleSubtaskToggle(id: string, checked: boolean) {
  if (checked) {
    if (!selectedSubtaskIds.value.includes(id)) {
      selectedSubtaskIds.value.push(id)
    }
  } else {
    selectedSubtaskIds.value = selectedSubtaskIds.value.filter((x) => x !== id)
  }
}

function handleSubtaskTitleUpdate(id: string, title: string) {
  const task = displayActivities.value.find((t) => t.id === id)
  if (task) task.title = title
}

function handleSubtaskDescriptionUpdate(id: string, description: string) {
  const task = displayActivities.value.find((t) => t.id === id)
  if (task) task.description = description
}

async function groupSubtasksWithAI() {
  if (!selectedSubtaskIds.value.length || isAILoading.value) return
  isAILoading.value = true

  try {
    const parentSummary = issueSummary.value || exportRow.value?.project || ''
    const selectedTasks = displayActivities.value.filter((t) =>
      selectedSubtaskIds.value.includes(t.id || ''),
    )
    const prompt = getJiraGroupSubtasksPrompt(parentSummary, selectedTasks)

    const response = await generateSummary(prompt, { temperature: 0.2 })

    const parsed = parseAiJsonResponse<JiraChildTask>(
      response,
      (item) => {
        if (typeof item === 'string') {
          return { id: generateId(), title: String(item).trim(), description: '' }
        }
        if (item && typeof item === 'object' && 'title' in (item as Record<string, unknown>)) {
          return {
            id: generateId(),
            title: String((item as Record<string, unknown>).title).trim(),
            description: String((item as Record<string, unknown>).description || '').trim(),
          }
        }
        return null
      },
      (line) => {
        const title = line.replace(/^[-*•\d.\s]+/, '').trim()
        return title.length > 2 ? { id: generateId(), title, description: '' } : null
      },
    )

    if (parsed.length > 0) {
      displayActivities.value = parsed
      selectedSubtaskIds.value = parsed.map((t) => t.id || '').filter(Boolean)
      success('AI grouped and filtered subtasks successfully!')
      saveJiraExportData()
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

async function saveJiraExportData() {
  if (!exportPeriod.value || !exportProjectKey.value) return
  try {
    const { upsertJiraExportData } = await import('~/queries/jiraExport')
    await upsertJiraExportData({
      month: exportPeriod.value,
      project: exportProjectKey.value,
      description: issueDescription.value.trim() || null,
      childTasks: JSON.stringify(displayActivities.value.filter((t) => t.title.trim())),
    })
  } catch (err) {
    console.error('Failed to save Jira export data:', err)
    error('Failed to save changes')
  }
}

async function generateParentDescription() {
  if (!issueSummary.value.trim() || isDescriptionLoading.value) return
  isDescriptionLoading.value = true

  try {
    const prompt = getJiraParentDescriptionPrompt(
      issueSummary.value.trim(),
      displayActivities.value,
    )

    const response = await generateSummary(prompt, { temperature: 0.3 })
    issueDescription.value = response.trim()
    success('Description generated!')
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)
    error(errMsg || 'Failed to generate description')
  } finally {
    isDescriptionLoading.value = false
  }
}

function closeModal() {
  saveJiraExportData()
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
