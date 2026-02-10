import { drizzle } from 'drizzle-orm/bun-sqlite'
import * as schema from '@/db/schema'

const dbPath = process.env.DATABASE_PATH ?? 'data/db.sqlite'

export const db = drizzle({
  connection: { source: dbPath },
  schema,
})
