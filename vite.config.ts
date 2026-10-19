import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

const oneDayCache = { headers: { 'cache-control': 'public, max-age=86400' } }

export default defineConfig(({ command }) => {
  const isDev = command === 'serve'
  const isTest = process.env.VITEST === 'true'

  return {
    plugins: [
      ...(isDev && !isTest ? [devtools()] : []),
      tsconfigPaths({ projects: ['./tsconfig.json'] }),
      tailwindcss(),
      ...(!isTest
        ? [
            tanstackStart({
              prerender: {
                enabled: true,
                crawlLinks: true,
                // `/` is server-rendered per URL instead: a static file would be served for every
                // query string, so deep links like `/?session=ATH15` would hydrate against HTML
                // rendered without the session. The CDN caches each URL via `s-maxage`.
                filter: ({ path }) => path !== '/',
              },
            }),
            nitro({
              routeRules: {
                // Hashed assets (JS, CSS) — safe to cache indefinitely
                '/assets/**': {
                  headers: { 'cache-control': 'public, max-age=31536000, immutable' },
                },
                // Favicons (versioned via ?v= query param), app icons, and manifest
                '/favicon.ico': oneDayCache,
                '/favicon.svg': oneDayCache,
                '/logo192.png': oneDayCache,
                '/logo512.png': oneDayCache,
                '/manifest.json': oneDayCache,
                '/robots.txt': oneDayCache,
              },
            }),
          ]
        : []),
      viteReact(),
    ],
    build: {
      target: 'esnext',
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  }
})
