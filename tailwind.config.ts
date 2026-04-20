import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
    './composables/**/*.{js,ts}',
    './utils/**/*.{js,ts}'
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0b0c10',
        panel: '#14171d',
        panelSoft: '#191d24',
        line: '#252a33',
        muted: '#8b93a1',
        text: '#f3f4f6',
        action: '#f45116',
        actionSoft: '#7a220d',
        ok: '#21b26f',
        warn: '#e7b83f',
        danger: '#f04438'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Arial', 'sans-serif']
      },
      boxShadow: {
        panel: '0 18px 50px rgba(0, 0, 0, 0.24)'
      }
    }
  },
  plugins: []
} satisfies Config
