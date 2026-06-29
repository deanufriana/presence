import { watch, onMounted } from 'vue'

export function useDarkMode() {
  const isDark = useState<boolean>('dark-mode', () => false)

  const applyDarkMode = () => {
    if (import.meta.server) return

    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  onMounted(() => {
    const cookie = useCookie('dark_mode')
    const stored = cookie.value
    if (stored !== undefined && stored !== null) {
      isDark.value = String(stored) === 'true'
    } else {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    applyDarkMode()
  })

  const toggleDarkMode = () => {
    isDark.value = !isDark.value
    const cookie = useCookie('dark_mode', { maxAge: 60 * 60 * 24 * 365 })
    cookie.value = String(isDark.value)
    applyDarkMode()
  }

  watch(isDark, () => {
    applyDarkMode()
  })

  return {
    isDark,
    toggleDarkMode,
  }
}
