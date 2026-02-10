import { drizzle } from 'drizzle-orm/bun-sqlite'
import * as schema from '@/db/schema'

export const db = drizzle({
  connection: { source: 'db.sqlite' },
  schema,
})
