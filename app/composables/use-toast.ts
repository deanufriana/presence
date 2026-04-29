import { ref } from 'vue'

export interface ToastProps {
  id?: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success' | 'info' | 'loading'
  duration?: number
  open?: boolean
}

const toasts = ref<ToastProps[]>([])

export function useToast() {
  function toast(props: ToastProps & { id?: string }) {
    const id = props.id || Math.random().toString(36).substring(2, 9)

    // If ID exists, update existing toast and reset duration
    const existingIndex = toasts.value.findIndex((t) => t.id === id)
    if (existingIndex !== -1) {
      const updatedToast = { ...toasts.value[existingIndex], ...props, id, open: true }
      toasts.value[existingIndex] = updatedToast

      if (updatedToast.duration && updatedToast.duration !== Infinity) {
        setTimeout(() => dismiss(id), updatedToast.duration)
      }
      return id
    }

    const newToast = {
      ...props,
      id,
      open: true,
      duration: props.duration === undefined ? 5000 : props.duration,
    }

    toasts.value.push(newToast)

    if (newToast.duration && newToast.duration !== Infinity) {
      setTimeout(() => {
        dismiss(id)
      }, newToast.duration)
    }

    return id
  }

  function dismiss(id: string) {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index !== -1 && toasts.value[index]) {
      toasts.value[index]!.open = false
      setTimeout(() => {
        toasts.value = toasts.value.filter((t) => t.id !== id)
      }, 300) // Wait for animation
    }
  }

  return {
    toasts,
    toast,
    dismiss,
    success: (title: string, options?: Partial<ToastProps>) =>
      toast({ title, variant: 'success', ...options }),
    error: (title: string, options?: Partial<ToastProps>) =>
      toast({ title, variant: 'destructive', ...options }),
    info: (title: string, options?: Partial<ToastProps>) =>
      toast({ title, variant: 'info', ...options }),
    loading: (title: string, options?: Partial<ToastProps>) =>
      toast({ title, variant: 'loading', duration: 60000, ...options }),
  }
}
