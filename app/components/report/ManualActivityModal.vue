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
              <div
                class="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center"
              >
                <Sparkles class="h-4 w-4 text-blue-500" />
              </div>
              Manual Activity
            </CardTitle>
            <CardDescription>
              Adding task for {{ selectedDayForEntry?.date }}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <Label class="text-xs">Activity Description</Label>
              <textarea
                v-model="manualActivityText"
                placeholder="What did you work on today? (e.g. Documentation, Meeting, etc.)"
                class="w-full min-h-[200px] rounded-lg border border-border bg-muted/20 p-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                autofocus
              />
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
              @click="saveManualActivity"
              class="bg-blue-600 hover:bg-blue-700 text-white"
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
import { Sparkles } from "lucide-vue-next";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";

defineProps<{
  modelValue: boolean;
}>();

const dailyStore = useDailyStore();
const { saveManualActivity } = dailyStore;
const { selectedDayForEntry, manualActivityText } = storeToRefs(dailyStore);

defineEmits<{
  "update:modelValue": [value: boolean];
  "update:activityText": [value: string];
  save: [];
}>();
</script>
