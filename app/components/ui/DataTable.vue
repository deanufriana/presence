<template>
  <div class="overflow-x-auto">
    <table class="w-full text-xs border-collapse min-w-[700px]">
      <thead class="bg-muted/30">
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :class="[
              'px-4 py-3 text-left font-semibold border-b border-border/40',
              col.width ? `w-[${col.width}]` : '',
              col.headerClass || '',
            ]"
            :style="col.width ? { width: col.width } : {}"
          >
            <slot :name="`header-${col.key}`" :column="col">
              {{ col.label }}
            </slot>
          </th>
        </tr>
      </thead>
      <tbody>
        <template v-if="loading">
          <tr
            v-for="i in loadingRows"
            :key="`loading-${i}`"
            class="border-b border-border/10 last:border-0"
          >
            <td v-for="col in columns" :key="`loading-col-${col.key}`" class="px-4 py-3">
              <div class="h-4 bg-muted/40 rounded-md animate-pulse w-full"/>
            </td>
          </tr>
        </template>
        <template v-else-if="data.length">
          <tr
            v-for="(row, idx) in data"
            :key="idx"
            :class="[
              'border-b border-border/10 last:border-0 transition-colors',
              typeof rowClass === 'function' ? rowClass(row, idx) : rowClass,
              'hover:bg-muted/5',
            ]"
          >
            <td v-for="col in columns" :key="col.key" :class="['p-0', col.cellClass || '']">
              <slot :name="`cell-${col.key}`" :row="row" :index="idx">
                <div class="px-4 py-2">
                  {{ (row as any)[col.key] }}
                </div>
              </slot>
            </td>
          </tr>
        </template>
        <tr v-else>
          <td :colspan="columns.length" class="p-16">
            <slot name="empty">
              <div
                class="flex flex-col items-center justify-center text-center text-muted-foreground"
              >
                <div
                  v-if="emptyIcon"
                  class="h-8 w-8 mb-2 opacity-20 flex items-center justify-center"
                >
                  <component :is="emptyIcon" class="h-8 w-8" />
                </div>
                <span>{{ emptyMessage || 'No data available' }}</span>
              </div>
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts" generic="T">
import type { Component } from 'vue'

interface Column {
  key: string
  label: string
  width?: string
  class?: string
  headerClass?: string
  cellClass?: string
}

withDefaults(
  defineProps<{
    data: T[]
    columns: Column[]
    rowClass?: string | ((row: T, index: number) => string)
    emptyMessage?: string
    emptyIcon?: Component
    loading?: boolean
    loadingRows?: number
  }>(),
  {
    loadingRows: 5,
    loading: false,
    rowClass: '',
    emptyMessage: '',
    emptyIcon: undefined,
  },
)
</script>
