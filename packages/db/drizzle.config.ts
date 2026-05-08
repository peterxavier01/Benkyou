import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({
  path: [
    '../../apps/web/.env.local',
    '../../apps/web/.env',
    '../../.env.local',
    '../../.env',
    '.env.local',
    '.env',
  ],
})

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run Drizzle commands.')
}

export default defineConfig({
  out: './drizzle',
  schema: './src/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
})
