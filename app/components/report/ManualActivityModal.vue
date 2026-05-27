<template>
  <Dialog :open="modelValue" @update:open="$emit('update:modelValue', $event)">
    <DialogContent class="w-full max-w-2xl overflow-hidden p-0 border-primary/20 shadow-2xl">
      <DialogHeader class="p-6 pb-0">
        <DialogTitle class="flex items-center gap-2">
          <div class="size-8 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Sparkles class="size-4 text-blue-500" />
          </div>
          Manual Activity
        </DialogTitle>
        <DialogDescription> Adding task for {{ selectedDayForEntry?.date }} </DialogDescription>
      </DialogHeader>

      <div class="p-6 space-y-4">
        <!-- Holiday Section -->
        <Card class="bg-red-500/10 border-red-500/20 overflow-hidden shadow-none">
          <CardContent class="p-3">
            <FieldSet>
              <FieldGroup class="space-y-3">
                <Field orientation="horizontal" class="flex items-center gap-3">
                  <Checkbox
                    id="isHoliday"
                    :model-value="isManualHoliday"
                    class="border-red-500 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                    @update:model-value="isManualHoliday = $event === true"
                  />
                  <FieldLabel
                    for="isHoliday"
                    class="text-xs font-bold text-red-500 dark:text-red-400 cursor-pointer select-none"
                  >
                    Mark as Holiday / Cuti Bersama
                  </FieldLabel>
                </Field>

                <!-- Holiday Name (Visible only if isHoliday is checked) -->
                <Field
                  v-if="isManualHoliday"
                  class="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200"
                >
                  <FieldLabel
                    for="holidayName"
                    class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider"
                  >
                    Holiday Name
                  </FieldLabel>
                  <Input
                    id="holidayName"
                    v-model="manualHolidayName"
                    placeholder="e.g. Eid Al-Fitr, Good Friday, etc."
                    class="h-8 text-sm bg-background"
                  />
                </Field>
              </FieldGroup>
            </FieldSet>
          </CardContent>
        </Card>

        <!-- Time In & Time Out Section -->
        <div class="grid grid-cols-2 gap-4">
          <Field class="space-y-2">
            <FieldLabel
              for="timeIn"
              class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider"
            >
              Time In
            </FieldLabel>
            <Input id="timeIn" v-model="manualMasukText" type="time" class="h-9 bg-background" />
          </Field>
          <Field class="space-y-2">
            <FieldLabel
              for="timeOut"
              class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider"
            >
              Time Out
            </FieldLabel>
            <Input id="timeOut" v-model="manualPulangText" type="time" class="h-9 bg-background" />
          </Field>
        </div>

        <!-- Activity Description Section -->
        <Field class="space-y-2">
          <FieldLabel
            for="activityText"
            class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider"
          >
            Activity Description
          </FieldLabel>
          <Textarea
            id="activityText"
            v-model="manualActivityText"
            placeholder="What did you work on today? (e.g. Documentation, Meeting, etc.)"
            class="w-full min-h-[150px] bg-muted/20 p-4 text-sm resize-none"
            autofocus
          />
        </Field>
      </div>

      <DialogFooter class="flex justify-end gap-2 border-t border-border/40 bg-muted/5 p-4">
        <Button variant="ghost" size="sm" @click="$emit('update:modelValue', false)">Cancel</Button>
        <Button
          size="sm"
          class="bg-blue-600 hover:bg-blue-700 text-white"
          @click="saveManualActivity"
        >
          Save Activity
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Sparkles } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Field, FieldGroup, FieldLabel, FieldSet } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Checkbox } from '~/components/ui/checkbox'
import { storeToRefs } from 'pinia'
import { useDailyStore } from '~/stores/daily'

defineProps<{
  modelValue: boolean
}>()

const dailyStore = useDailyStore()
const { saveManualActivity } = dailyStore
const {
  selectedDayForEntry,
  manualActivityText,
  manualHolidayName,
  isManualHoliday,
  manualMasukText,
  manualPulangText,
} = storeToRefs(dailyStore)

defineEmits<{
  'update:modelValue': [value: boolean]
  'update:activityText': [value: string]
  save: []
}>()
</script>
