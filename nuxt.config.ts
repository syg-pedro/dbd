import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) return {}

  return readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .reduce<Record<string, string>>((env, line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return env
      const separator = trimmed.indexOf('=')
      if (separator === -1) return env
      const key = trimmed.slice(0, separator).trim()
      const value = trimmed.slice(separator + 1).trim()
      env[key] = value
      return env
    }, {})
}

const localEnv = loadLocalEnv()
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL || localEnv.SUPABASE_URL || ''
const supabaseKey =
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY ||
  localEnv.SUPABASE_KEY ||
  localEnv.SUPABASE_ANON_KEY ||
  ''

export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2026-04-20',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/supabase', '@vite-pwa/nuxt'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'DBD Demandas',
      htmlAttrs: { lang: 'pt-BR' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#0b0c10' },
        {
          name: 'description',
          content: 'Sistema operacional de demandas para design.'
        }
      ],
      link: [
        { rel: 'icon', href: '/icons/icon-192.png' },
        { rel: 'apple-touch-icon', href: '/icons/icon-192.png' }
      ]
    }
  },
  supabase: {
    url: supabaseUrl || 'https://placeholder.supabase.co',
    key: supabaseKey || 'placeholder-anon-key',
    redirect: false
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'DBD Demandas',
      short_name: 'DBD',
      description: 'Gestao rapida de demandas de design.',
      theme_color: '#0b0c10',
      background_color: '#0b0c10',
      display: 'standalone',
      start_url: '/',
      lang: 'pt-BR',
      icons: [
        {
          src: '/icons/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/icons/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,ico,svg}'],
      navigateFallback: '/'
    },
    client: {
      installPrompt: true
    }
  },
  tailwindcss: {
    exposeConfig: false
  },
  typescript: {
    strict: true,
    typeCheck: true
  }
})
