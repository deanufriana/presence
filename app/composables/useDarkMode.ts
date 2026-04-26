import { watch, onMounted } from 'vue'

export function useDarkMode () {
    const isDark = useState<boolean>('dark-mode', () => false)

    const initDarkMode = () => {
        if (import.meta.server) return

        // Check cookie first, then system preference
        const cookie = useCookie('dark_mode')
        const stored = cookie.value
        if (stored !== undefined && stored !== null) {
            isDark.value = String(stored) === 'true'
        } else {
            isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
        }
        applyDarkMode()
    }

    const applyDarkMode = () => {
        if (import.meta.server) return

        if (isDark.value) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }

    const toggleDarkMode = () => {
        isDark.value = !isDark.value
        const cookie = useCookie('dark_mode', { maxAge: 60 * 60 * 24 * 365 })
        cookie.value = String(isDark.value)
        applyDarkMode()
    }

    onMounted(() => {
        initDarkMode()
    })

    watch(isDark, () => {
        applyDarkMode()
    }, { immediate: true })

    return {
        isDark,
        toggleDarkMode,
        initDarkMode
    }
}
