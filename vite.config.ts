import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

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
            cloudflare({ viteEnvironment: { name: 'ssr' } }),
            tanstackStart({
              prerender: {
                enabled: true,
                crawlLinks: true,
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
