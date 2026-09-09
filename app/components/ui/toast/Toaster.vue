<script setup lang="ts">
import { ToastProvider, ToastViewport } from 'reka-ui'
import Toast from './Toast.vue'
import { useToast } from '~/composables/use-toast'

const { toasts } = useToast()
</script>

<template>
  <ToastProvider>
    <Toast v-for="toast in toasts" :key="toast.id" v-bind="toast" />
    <ToastViewport
      class="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[480px]"
    />
  </ToastProvider>
</template>
