<template>
  <FieldSet class="space-y-2 border-t border-border/40 pt-3">
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

      <Button
        v-if="aiEnabled"
        variant="outline"
        size="sm"
        class="h-7 text-[10px] font-semibold gap-1 px-2 border-purple-500/30 text-purple-600 hover:text-purple-700 hover:bg-purple-50/50 dark:text-purple-400 dark:border-purple-500/20 dark:hover:bg-purple-950/20 cursor-pointer"
        :disabled="aiLoading || !selectedIds.length"
        @click="$emit('group-with-ai')"
      >
        <Sparkles v-if="!aiLoading" class="text-purple-500" data-icon="inline-start" />
        <RefreshCw v-else class="animate-spin text-purple-500" data-icon="inline-start" />
        {{ aiLoading ? 'AI Summarizing...' : 'AI Group & Summarize' }}
      </Button>
      <span v-else class="text-[9px] text-muted-foreground italic flex items-center gap-0.5">
        AI disabled (no API keys)
      </span>
    </div>

    <FieldGroup
      class="space-y-1 max-h-72 overflow-y-auto border border-border/50 rounded-lg p-3 bg-muted/5"
    >
      <div
        v-for="(act, idx) in tasks"
        :key="act.id || idx"
        class="p-2 rounded-md hover:bg-muted/10 transition-colors border-b border-border/20 last:border-0"
      >
        <div class="flex items-start gap-2.5">
          <Checkbox
            :id="'subtask-' + idx"
            :model-value="selectedIds.includes(act.id || '')"
            class="mt-1"
            @update:model-value="
              (checked: boolean | 'indeterminate') => {
                if (act.id) $emit('toggle', act.id, checked === true)
              }
            "
          />
          <div class="flex-1 min-w-0 space-y-1">
            <FieldLabel
              v-if="!selectedIds.includes(act.id || '')"
              :for="'subtask-' + idx"
              class="text-xs font-medium text-foreground cursor-pointer select-none leading-normal"
            >
              {{ act.title }}
            </FieldLabel>
            <div v-else class="animate-in fade-in slide-in-from-top-1 duration-150 space-y-1">
              <Input
                :model-value="act.title"
                placeholder="Task title"
                class="h-7 text-[11px]"
                @update:model-value="$emit('change-title', act.id || '', String($event))"
              />
              <Textarea
                :model-value="act.description"
                placeholder="Task description (optional)"
                class="text-[10px] min-h-[36px] resize-none"
                @update:model-value="$emit('change-description', act.id || '', String($event))"
              />
            </div>
          </div>
        </div>
      </div>
    </FieldGroup>
  </FieldSet>
</template>

<script setup lang="ts">
import { ListTodo, Sparkles, RefreshCw } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { FieldSet, FieldLegend, FieldGroup, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Checkbox } from '~/components/ui/checkbox'
import type { JiraChildTask } from '~/types/report'

defineProps<{
  tasks: JiraChildTask[]
  selectedIds: string[]
  aiEnabled: boolean
  aiLoading: boolean
}>()

defineEmits<{
  toggle: [id: string, checked: boolean]
  'change-title': [id: string, title: string]
  'change-description': [id: string, description: string]
  'group-with-ai': []
}>()
</script>
