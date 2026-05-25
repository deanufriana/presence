<template>
  <div class="min-h-screen bg-background text-foreground transition-colors duration-300">
    <!-- Navbar -->
    <nav
      class="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl"
    >
      <div class="container mx-auto flex h-14 items-center justify-between px-6">
        <div class="flex items-center gap-3">
          <div
            class="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md shadow-violet-500/20"
          >
            <ClipboardCheck class="size-4 text-white" :stroke-width="2.5" />
          </div>
          <span class="text-lg font-semibold tracking-tight">Presence</span>
          <Badge variant="secondary" class="text-[10px] px-1.5 py-0 font-medium">v1.0</Badge>
        </div>

        <div class="flex items-center gap-2">
          <ClientOnly>
            <Button
              variant="ghost"
              size="xs"
              class="size-8 px-0 text-muted-foreground hover:text-foreground"
              @click="toggleDarkMode"
            >
              <Moon v-if="!isDark" />
              <Sun v-else />
            </Button>
            <template #fallback>
              <div class="size-8" />
            </template>
          </ClientOnly>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="container mx-auto px-6 py-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ClipboardCheck, Moon, Sun } from 'lucide-vue-next'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'

const { isDark, toggleDarkMode } = useDarkMode()
</script>
