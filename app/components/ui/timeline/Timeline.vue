<template>
  <div v-if="loading" class="p-8 space-y-6">
    <div v-for="i in 5" :key="i" class="flex gap-6 animate-pulse">
      <div class="w-14 h-14 bg-muted rounded-xl shrink-0" />
      <div class="flex-1 space-y-3">
        <div class="h-5 bg-muted rounded w-1/4" />
        <div class="h-20 bg-muted rounded w-full" />
      </div>
    </div>
  </div>

  <div
    v-else-if="items.length === 0"
    class="flex flex-col items-center justify-center py-24 text-muted-foreground"
  >
    <slot name="empty">
      <div class="relative mb-6">
        <div class="absolute inset-0 bg-violet-500/20 blur-2xl rounded-full" />
        <div
          class="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50 border border-border/50"
        >
          <FileText class="h-10 w-10 opacity-40" />
        </div>
      </div>
      <p class="text-sm font-medium">{{ emptyMessage }}</p>
      <p v-if="emptySubmessage" class="text-xs text-muted-foreground/60 mt-1">
        {{ emptySubmessage }}
      </p>
    </slot>
  </div>

  <div v-else class="p-4 sm:p-8 relative">
    <!-- Vertical Timeline Line -->
    <div
      class="absolute left-10 sm:left-14 top-12 bottom-12 w-0.5 bg-gradient-to-b from-violet-500/20 via-violet-500/10 to-transparent z-0 hidden sm:block"
    />

    <div class="space-y-8 relative z-10">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="flex flex-col sm:flex-row gap-4 sm:gap-8 group/row"
      >
        <!-- Date/Label Section -->
        <div
          class="w-full sm:w-20 flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1 text-right shrink-0 pt-1"
        >
          <slot name="date" :item="item" :index="index" />
          <slot name="metadata" :item="item" :index="index" />
        </div>

        <!-- Content Section -->
        <div class="flex-1">
          <div
            class="relative group rounded-2xl border transition-all duration-300"
            :class="[
              getRowClass ? getRowClass(item) : 'bg-card border-border/50',
              'hover:border-violet-500/30 hover:shadow-xl hover:shadow-violet-500/5',
            ]"
          >
            <slot name="badge" :item="item" :index="index" />

            <div class="p-5">
              <div class="flex flex-col lg:flex-row gap-6">
                <!-- Main Content -->
                <div class="flex-1 min-h-[60px]">
                  <slot name="content" :item="item" :index="index" />
                </div>

                <!-- Actions -->
                <div
                  class="flex lg:flex-col items-center justify-end lg:justify-start gap-2 border-t lg:border-t-0 lg:border-l border-border/40 pt-4 lg:pt-0 lg:pl-4 shrink-0"
                >
                  <slot name="actions" :item="item" :index="index" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T">
import { FileText } from 'lucide-vue-next'

interface Props {
  items: T[]
  loading?: boolean
  emptyMessage?: string
  emptySubmessage?: string
  getRowClass?: (item: T) => string
}

withDefaults(defineProps<Props>(), {
  loading: false,
  emptyMessage: 'No records found',
  emptySubmessage: '',
  getRowClass: () => '',
})
</script>
