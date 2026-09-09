<template>
  <Dialog :open="modelValue" @update:open="$emit('update:modelValue', $event)">
    <DialogContent
      class="w-full max-w-2xl max-h-[85vh] flex flex-col p-0 border-violet-500/20 shadow-2xl overflow-hidden"
    >
      <!-- Header -->
      <DialogHeader class="p-6 pb-4 border-b border-border/40 bg-muted/10 shrink-0">
        <div class="flex items-center justify-between">
          <DialogTitle class="flex items-center gap-2.5 text-base font-bold">
            <div
              class="size-8 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center"
            >
              <Scale class="size-4" />
            </div>
            Auto-Balance Daily Activities
          </DialogTitle>
          <Badge
            variant="outline"
            class="text-[10px] font-bold border-violet-500/30 text-violet-600 dark:text-violet-400 bg-violet-500/5"
          >
            Max &plusmn;2 Days Window
          </Badge>
        </div>
        <DialogDescription class="mt-1.5 text-xs text-muted-foreground">
          Evenly redistributes activities from high-volume days to empty or light workdays without
          shifting any task more than 2 days from its original date.
        </DialogDescription>

        <!-- Target Adjustment Control -->
        <div
          class="flex items-center justify-between mt-3 p-2.5 rounded-xl bg-muted/30 border border-border/40"
        >
          <div class="flex items-center gap-2">
            <SlidersHorizontal class="size-3.5 text-violet-500" />
            <span class="text-xs font-semibold text-foreground">Target activities per day:</span>
          </div>
          <div class="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              class="size-6 rounded-md"
              :disabled="targetPerDay <= 1"
              title="Decrease target"
              @click="targetPerDay--"
            >
              <Minus class="size-3" />
            </Button>
            <span class="w-6 text-center text-xs font-black tabular-nums text-foreground">{{
              targetPerDay
            }}</span>
            <Button
              variant="outline"
              size="icon"
              class="size-6 rounded-md"
              :disabled="targetPerDay >= 5"
              title="Increase target"
              @click="targetPerDay++"
            >
              <Plus class="size-3" />
            </Button>
            <span class="text-[10px] text-muted-foreground ml-1">(min 1, max 5)</span>
          </div>
        </div>

        <!-- Stats Bar -->
        <div v-if="proposals.length > 0" class="grid grid-cols-3 gap-2 mt-3">
          <div class="p-2 rounded-lg bg-muted/40 border border-border/40 text-center">
            <div class="text-base font-black tabular-nums text-foreground">
              {{ selectedCount }} / {{ proposals.length }}
            </div>
            <div class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Moves Selected
            </div>
          </div>
          <div class="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
            <div class="text-base font-black tabular-nums text-emerald-600 dark:text-emerald-400">
              +{{ stats.resolvedEmptyDays }}
            </div>
            <div
              class="text-[10px] font-bold uppercase tracking-wider text-emerald-600/70 dark:text-emerald-400/70"
            >
              Empty Days Filled
            </div>
          </div>
          <div class="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
            <div class="text-base font-black tabular-nums text-blue-600 dark:text-blue-400">
              &plusmn;{{ maxDistanceUsed }}d
            </div>
            <div
              class="text-[10px] font-bold uppercase tracking-wider text-blue-600/70 dark:text-blue-400/70"
            >
              Max Proximity
            </div>
          </div>
        </div>
      </DialogHeader>

      <!-- Body / List of Proposals -->
      <div class="flex-1 overflow-y-auto p-6 space-y-3 min-h-[160px]">
        <!-- Empty State -->
        <div
          v-if="proposals.length === 0"
          class="h-48 flex flex-col items-center justify-center text-center p-6 space-y-2 rounded-xl border border-dashed border-border/60"
        >
          <div
            class="size-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500"
          >
            <CheckCircle2 class="size-6" />
          </div>
          <div class="font-bold text-sm text-foreground">Activities Already Balanced</div>
          <div class="text-xs text-muted-foreground max-w-sm">
            No workdays have empty or clustered activities that can be redistributed within the
            &plusmn;2 day window.
          </div>
        </div>

        <!-- Proposals List -->
        <template v-else>
          <div class="flex items-center justify-between pb-1 text-xs">
            <span class="text-muted-foreground font-semibold">
              Proposed Redistribution ({{ proposals.length }} items)
            </span>
            <div class="flex gap-2">
              <Button
                variant="ghost"
                size="xs"
                class="h-6 text-[11px] text-muted-foreground hover:text-foreground"
                @click="toggleAll(true)"
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="xs"
                class="h-6 text-[11px] text-muted-foreground hover:text-foreground"
                @click="toggleAll(false)"
              >
                Deselect All
              </Button>
            </div>
          </div>

          <div class="space-y-2">
            <div
              v-for="prop in proposals"
              :key="prop.id"
              class="group flex items-start gap-3 p-3 rounded-xl border transition-all"
              :class="
                prop.selected
                  ? 'bg-violet-500/5 border-violet-500/20 shadow-xs'
                  : 'bg-muted/10 border-border/40 opacity-60'
              "
            >
              <Checkbox
                :id="prop.id"
                :model-value="prop.selected"
                class="mt-1 border-violet-500/40 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                @update:model-value="prop.selected = $event === true"
              />

              <div class="flex-1 min-w-0 space-y-1.5">
                <!-- Date Shift Header -->
                <div class="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span class="text-muted-foreground tabular-nums">
                    {{ formatDateLabel(prop.sourceDate) }}
                  </span>
                  <div class="flex items-center gap-1">
                    <ArrowRight class="size-3 text-muted-foreground/60" />
                    <Badge
                      variant="outline"
                      class="text-[10px] px-1.5 py-0 h-4 font-bold tabular-nums"
                      :class="
                        Math.abs(prop.distanceDays) === 1
                          ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5'
                          : 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5'
                      "
                    >
                      {{
                        prop.distanceDays > 0 ? `+${prop.distanceDays}d` : `${prop.distanceDays}d`
                      }}
                    </Badge>
                    <ArrowRight class="size-3 text-muted-foreground/60" />
                  </div>
                  <span class="text-foreground font-bold tabular-nums">
                    {{ formatDateLabel(prop.targetDate) }}
                  </span>
                </div>

                <!-- Activity Text Snippet -->
                <div
                  class="text-xs text-foreground/80 leading-relaxed break-words bg-background/50 p-2 rounded-lg border border-border/30"
                >
                  {{ prop.activityText }}
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Footer -->
      <DialogFooter
        class="p-4 border-t border-border/40 bg-muted/10 flex flex-row items-center justify-between gap-2 shrink-0"
      >
        <Button variant="ghost" size="sm" @click="$emit('update:modelValue', false)">
          Cancel
        </Button>
        <Button
          variant="gradient"
          size="sm"
          :disabled="selectedCount === 0 || applying"
          @click="applyMoves"
        >
          <Sparkles class="size-3.5" data-icon="inline-start" />
          {{
            applying
              ? 'Applying...'
              : `Apply ${selectedCount} Move${selectedCount === 1 ? '' : 's'}`
          }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Scale,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Minus,
  Plus,
  SlidersHorizontal,
} from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Checkbox } from '~/components/ui/checkbox'
import { useDailyStore } from '~/stores/daily'
import { useCoreStore } from '~/stores/core'
import { useCalendarStore } from '~/stores/calendar'
import { storeToRefs } from 'pinia'
import { computeBalancedMoves, type ActivityMoveProposal } from '~/utils/balance'
import { format, parseISO } from 'date-fns'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const coreStore = useCoreStore()
const dailyStore = useDailyStore()
const calendarStore = useCalendarStore()

const { selectedDate } = storeToRefs(coreStore)
const { dailyTable } = storeToRefs(dailyStore)
const { isHoliday } = calendarStore

const targetPerDay = ref(3)
const proposals = ref<ActivityMoveProposal[]>([])
const stats = ref({
  totalMoves: 0,
  resolvedEmptyDays: 0,
  donorDaysCount: 0,
  recipientDaysCount: 0,
})
const applying = ref(false)

const calculateProposals = () => {
  const result = computeBalancedMoves(selectedDate.value, dailyTable.value, isHoliday, {
    maxDistanceDays: 2,
    targetPerDay: targetPerDay.value,
    minKeepDonor: 1,
  })
  proposals.value = result.proposals
  stats.value = result.stats
}

watch(targetPerDay, () => {
  calculateProposals()
})

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      calculateProposals()
    }
  },
  { immediate: true },
)

const selectedCount = computed(() => proposals.value.filter((p) => p.selected).length)

const maxDistanceUsed = computed(() => {
  if (proposals.value.length === 0) return 0
  return Math.max(...proposals.value.map((p) => Math.abs(p.distanceDays)))
})

const formatDateLabel = (dateStr: string) => {
  try {
    return format(parseISO(dateStr), 'dd MMM (EEE)')
  } catch {
    return dateStr
  }
}

const toggleAll = (select: boolean) => {
  proposals.value.forEach((p) => {
    p.selected = select
  })
}

const applyMoves = async () => {
  const selectedMoves = proposals.value.filter((p) => p.selected)
  if (selectedMoves.length === 0) return

  applying.value = true
  try {
    await dailyStore.applyActivityMoves(selectedMoves)
    emit('update:modelValue', false)
  } catch (err) {
    console.error('Failed to apply balanced moves:', err)
  } finally {
    applying.value = false
  }
}
</script>
