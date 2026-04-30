import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: 'Presence',
      link: [{ rel: 'icon', type: 'image/png', href: '/favicon.ico' }],
    },
  },
  ssr: false,
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  vite: {
    plugins: [tailwindcss()],
    // Tauri expects a fixed port, and it should match tauri.conf.json
    server: {
      strictPort: true,
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        port: 5183,
      },
    },
  },
  devServer: {
    port: 3000,
  },
  modules: ['@pinia/nuxt', '@nuxt/eslint', 'shadcn-nuxt'],
  components: [
    {
      path: '~/components',
      extensions: ['.vue'],
    },
  ],
})
