import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: 'Report Absensi',
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.ico' }
      ]
    },
  },
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  modules: [
    '@pinia/nuxt',
  ],
  components: [
    {
      path: '~/components',
      extensions: ['.vue'],
    }
  ],
})
