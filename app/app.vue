<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Toaster />
  </div>
</template>

<script setup lang="ts">
import Toaster from '~/components/ui/toast/Toaster.vue'
import { useToast } from '~/composables/use-toast'

const { success } = useToast()

onMounted(() => {
  success('App Ready', { description: 'System initialized successfully' })
})
</script>
