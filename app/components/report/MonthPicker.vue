<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        size="sm"
        class="w-[180px] justify-start text-left font-medium gap-2 border-border bg-card hover:border-primary/40"
      >
        <CalendarIcon class="h-4 w-4 text-muted-foreground shrink-0" />
        {{ dateDisplay }}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-64 p-3" align="end">
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            class="h-7 w-7"
            @click="changeYear(-1)"
          >
            <ChevronLeft class="h-4 w-4" />
          </Button>
          <div class="text-sm font-bold">{{ pickerYear }}</div>
          <Button
            variant="outline"
            size="icon"
            class="h-7 w-7"
            @click="changeYear(1)"
          >
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <Button
            v-for="(m, i) in months"
            :key="m"
            size="sm"
            variant="ghost"
            class="h-9 w-full text-[10px] font-medium"
            :class="{
              'bg-primary text-primary-foreground hover:bg-primary/90':
                isCurrentMonth(i),
            }"
            @click="selectMonth(i)"
          >
            {{ m }}
          </Button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-vue-next";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  format,
  parse,
  isValid,
  setMonth,
  setYear,
} from "date-fns";
import { DateFormatter } from "@internationalized/date";

const modelValue = defineModel<string>({ required: true });

const df = new DateFormatter("en-US", {
  month: "long",
  year: "numeric",
});

const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const internalDate = ref(new Date());

// Sync string "YYYY-MM" to internalDate
watch(
  modelValue,
  (newVal) => {
    if (!newVal) return;
    const parsed = parse(newVal, "yyyy-MM", new Date());
    if (isValid(parsed)) {
      internalDate.value = parsed;
    }
  },
  { immediate: true },
);

const pickerYear = computed(() => internalDate.value.getFullYear());

const changeYear = (delta: number) => {
  internalDate.value = setYear(
    internalDate.value,
    internalDate.value.getFullYear() + delta,
  );
  modelValue.value = format(internalDate.value, "yyyy-MM");
};

const selectMonth = (monthIndex: number) => {
  internalDate.value = setMonth(internalDate.value, monthIndex);
  modelValue.value = format(internalDate.value, "yyyy-MM");
};

const isCurrentMonth = (monthIndex: number) => {
  return internalDate.value.getMonth() === monthIndex;
};

const dateDisplay = computed(() => {
  return df.format(internalDate.value);
});
</script>
