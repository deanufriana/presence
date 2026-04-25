// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-04-25',
  devtools: { enabled: true },
  css: ['~/assets/css/tailwind.css'],
  modules: ['@nuxtjs/tailwindcss', 'shadcn-nuxt', '@nuxtjs/color-mode'],
  colorMode: {
    classSuffix: '', // Required for Tailwind CSS dark mode compatibility
  },
  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: './app/components/ui'
  },
})
