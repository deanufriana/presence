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
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        @click.self="$emit('update:modelValue', false)"
      >
        <Card class="w-full max-w-2xl shadow-2xl border-primary/20">
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <div class="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Sparkles class="h-4 w-4 text-blue-500" />
              </div>
              Manual Activity
            </CardTitle>
            <CardDescription> Adding task for {{ selectedDayForEntry?.date }} </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <!-- Holiday Section -->
              <Card class="bg-red-500/10 border-red-500/20 overflow-hidden shadow-none">
                <CardContent class="p-3 space-y-3">
                  <div class="flex items-center space-x-3">
                    <Checkbox
                      id="isHoliday"
                      v-model="isManualHoliday"
                      class="border-red-500 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                    />
                    <Label
                      for="isHoliday"
                      class="text-xs font-bold text-red-500 dark:text-red-400 cursor-pointer select-none"
                    >
                      Mark as Holiday / Cuti Bersama
                    </Label>
                  </div>

                  <!-- Holiday Name (Visible only if isHoliday is checked) -->
                  <div
                    v-if="isManualHoliday"
                    class="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200"
                  >
                    <Label
                      class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider"
                      >Holiday Name</Label
                    >
                    <input
                      v-model="manualHolidayName"
                      placeholder="e.g. Eid Al-Fitr, Good Friday, etc."
                      class="w-full h-8 rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                  </div>
                </CardContent>
              </Card>

              <div class="space-y-2">
                <Label class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider"
                  >Activity Description</Label
                >
                <textarea
                  v-model="manualActivityText"
                  placeholder="What did you work on today? (e.g. Documentation, Meeting, etc.)"
                  class="w-full min-h-[150px] rounded-lg border border-border bg-muted/20 p-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  autofocus
                />
              </div>
            </div>
          </CardContent>
          <CardFooter class="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" @click="$emit('update:modelValue', false)"
              >Cancel</Button
            >
            <Button
              size="sm"
              class="bg-blue-600 hover:bg-blue-700 text-white"
              @click="saveManualActivity"
            >
              Save Activity
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { Sparkles } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '~/components/ui/card'
import { Label } from '~/components/ui/label'
import { Checkbox } from '~/components/ui/checkbox'

defineProps<{
  modelValue: boolean
}>()

const dailyStore = useDailyStore()
const { saveManualActivity } = dailyStore
const { selectedDayForEntry, manualActivityText, manualHolidayName, isManualHoliday } =
  storeToRefs(dailyStore)

defineEmits<{
  'update:modelValue': [value: boolean]
  'update:activityText': [value: string]
  save: []
}>()
</script>
