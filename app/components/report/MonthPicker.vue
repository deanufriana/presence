<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        size="sm"
        class="w-[180px] justify-start text-left font-medium border-border bg-card hover:border-primary/40"
      >
        <CalendarIcon class="text-muted-foreground" data-icon="inline-start" />
        {{ dateDisplay }}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-64 p-3" align="end">
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <Button variant="outline" size="icon" class="size-7" @click="changeYear(-1)">
            <ChevronLeft />
          </Button>
          <div class="text-sm font-bold">{{ pickerYear }}</div>
          <Button
            variant="outline"
            size="icon"
            class="size-7"
            :disabled="pickerYear >= new Date().getFullYear()"
            @click="changeYear(1)"
          >
            <ChevronRight />
          </Button>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <Button
            v-for="(m, i) in months"
            :key="m"
            size="sm"
            :variant="isCurrentMonth(i) ? 'default' : 'ghost'"
            class="w-full text-[10px] font-medium"
            :disabled="isMonthDisabled(i)"
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
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { format, parse, isValid, setMonth, setYear } from 'date-fns'
import { DateFormatter } from '@internationalized/date'

const modelValue = defineModel<string>({ required: true })

const df = new DateFormatter('en-US', {
  month: 'long',
  year: 'numeric',
})

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const internalDate = ref(new Date())

// Sync string "YYYY-MM" to internalDate
watch(
  modelValue,
  (newVal) => {
    if (!newVal) return
    const parsed = parse(newVal, 'yyyy-MM', new Date())
    if (isValid(parsed)) {
      internalDate.value = parsed
    }
  },
  { immediate: true },
)

const pickerYear = computed(() => internalDate.value.getFullYear())

const changeYear = (delta: number) => {
  internalDate.value = setYear(internalDate.value, internalDate.value.getFullYear() + delta)
  modelValue.value = format(internalDate.value, 'yyyy-MM')
}

const selectMonth = (monthIndex: number) => {
  internalDate.value = setMonth(internalDate.value, monthIndex)
  modelValue.value = format(internalDate.value, 'yyyy-MM')
}

const isCurrentMonth = (monthIndex: number) => {
  return internalDate.value.getMonth() === monthIndex
}

const isMonthDisabled = (monthIndex: number) => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  if (pickerYear.value > currentYear) return true
  if (pickerYear.value === currentYear && monthIndex > currentMonth) return true
  return false
}

const dateDisplay = computed(() => {
  return df.format(internalDate.value)
})
</script>
