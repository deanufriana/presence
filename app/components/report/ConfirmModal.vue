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
          class="relative z-10 w-full max-w-[400px] shadow-2xl rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          :class="variant === 'destructive' ? 'border-red-500/20' : 'border-violet-500/20'"
        >
          <div :class="['h-1.5 w-full', variant === 'destructive' ? 'bg-red-500' : 'bg-violet-500']" />
          <CardHeader class="pb-2">
            <div :class="['flex items-center gap-3 mb-2', variant === 'destructive' ? 'text-red-600' : 'text-violet-600']">
              <div
                :class="['h-10 w-10 rounded-full flex items-center justify-center', variant === 'destructive' ? 'bg-red-50' : 'bg-violet-50']"
              >
                <slot name="icon" />
              </div>
              <CardTitle class="text-xl">{{ title }}</CardTitle>
            </div>
            <CardDescription class="text-balance">
              <slot>{{ description }}</slot>
            </CardDescription>
          </CardHeader>

          <CardFooter class="flex flex-col sm:flex-row gap-2 pt-4">
            <Button
              variant="outline"
              class="w-full sm:flex-1"
              @click="$emit('update:modelValue', false)"
            >
              {{ cancelText }}
            </Button>
            <Button
              class="w-full sm:flex-1 text-white"
              :class="variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : 'bg-violet-600 hover:bg-violet-700'"
              @click="$emit('confirm')"
            >
              {{ confirmText }}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { Button } from "~/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "~/components/ui/card";

withDefaults(defineProps<{
  modelValue: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}>(), {
  description: "",
  confirmText: "Confirm",
  cancelText: "Cancel",
  variant: "default",
});

defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [];
}>();
</script>
