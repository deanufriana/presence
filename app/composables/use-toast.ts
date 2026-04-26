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
    
    // If ID exists, update existing toast
    const existingIndex = toasts.value.findIndex(t => t.id === id)
    if (existingIndex !== -1) {
      toasts.value[existingIndex] = { ...toasts.value[existingIndex], ...props, id, open: true }
      return id
    }

    const newToast = { 
      ...props, 
      id, 
      open: true,
      duration: props.duration || 5000 
    }
    
    toasts.value.push(newToast)

    if (newToast.duration !== Infinity) {
      setTimeout(() => {
        dismiss(id)
      }, newToast.duration)
    }

    return id
  }

  function dismiss(id: string) {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index !== -1) {
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
    success: (title: string, options?: any) => toast({ title, variant: 'success', ...options }),
    error: (title: string, options?: any) => toast({ title, variant: 'destructive', ...options }),
    info: (title: string, options?: any) => toast({ title, variant: 'info', ...options }),
    loading: (title: string, options?: any) => toast({ title, variant: 'loading', duration: Infinity, ...options }),
  }
}
