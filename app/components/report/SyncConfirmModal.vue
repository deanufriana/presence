<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[110] flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          @click="$emit('update:modelValue', false)"
        />

        <!-- Dialog -->
        <Card
          class="relative z-10 w-full max-w-[400px] shadow-2xl border-violet-500/20 rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          <div class="h-1.5 w-full bg-violet-500" />
          <CardHeader class="pb-2">
            <div class="flex items-center gap-3 text-violet-600 mb-2">
              <div
                class="h-10 w-10 rounded-full bg-violet-50 flex items-center justify-center"
              >
                <RefreshCw class="h-6 w-6 animate-spin-slow" />
              </div>
              <CardTitle class="text-xl">Sync & Merge Data?</CardTitle>
            </div>
            <CardDescription class="text-balance">
              Fresh activities from GitLab will be merged with your existing
              report data for this month. Existing manual edits will be
              preserved.
            </CardDescription>
          </CardHeader>

          <CardFooter class="flex flex-col sm:flex-row gap-2 pt-4">
            <Button
              variant="outline"
              class="w-full sm:flex-1"
              @click="$emit('update:modelValue', false)"
            >
              Cancel
            </Button>
            <Button
              class="w-full sm:flex-1 bg-violet-600 hover:bg-violet-700 text-white"
              @click="$emit('confirm')"
            >
              Sync & Merge
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { RefreshCw } from "lucide-vue-next";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "~/components/ui/card";

defineProps<{
  modelValue: boolean;
}>();

defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [];
}>();
</script>
