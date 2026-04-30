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
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('lucide-vue-next')) return 'icons'
              if (id.includes('date-fns')) return 'date-utils'
              if (id.includes('reka-ui') || id.includes('radix-vue')) return 'ui-core'
              return 'vendor'
            }
          },
        },
      },
    },
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
  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },
})
