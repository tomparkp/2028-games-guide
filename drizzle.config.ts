import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

import { defineConfig } from 'drizzle-kit'

const D1_DIR = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject'

// Locate the local D1 sqlite file for Drizzle Studio. `drizzle-kit generate`
// doesn't actually open the DB so we return a placeholder when it's missing
// rather than blowing up.
function findLocalD1File(): string {
  if (!existsSync(D1_DIR)) return resolve(D1_DIR, 'missing.sqlite')
  const file = readdirSync(D1_DIR).find(
    (name) => name.endsWith('.sqlite') && name !== 'metadata.sqlite',
  )
  if (!file) return resolve(D1_DIR, 'missing.sqlite')
  return resolve(D1_DIR, file)
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  migrations: { prefix: 'timestamp' },
  dbCredentials: { url: findLocalD1File() },
})
