<template>
  <div
    class="min-h-screen bg-background text-foreground transition-colors duration-300"
  >
    <!-- Navbar -->
    <nav
      class="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl"
    >
      <div
        class="container mx-auto flex h-14 items-center justify-between px-6"
      >
        <div class="flex items-center gap-3">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md shadow-violet-500/20"
          >
            <ClipboardCheck class="h-4 w-4 text-white" :stroke-width="2.5" />
          </div>
          <span class="text-lg font-semibold tracking-tight">Presence</span>
          <Badge variant="secondary" class="text-[10px] px-1.5 py-0 font-medium"
            >v1.0</Badge
          >
        </div>

        <div class="flex items-center gap-2">
          <ClientOnly>
            <button
              @click="toggleDarkMode"
              class="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
            >
              <Moon v-if="!isDark" class="h-4 w-4" />
              <Sun v-else class="h-4 w-4" />
            </button>
            <template #fallback>
              <div class="h-8 w-8"></div>
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
import { ClipboardCheck, Moon, Sun } from "lucide-vue-next";
import { Badge } from "~/components/ui/badge";

const { isDark, toggleDarkMode } = useDarkMode();
</script>
