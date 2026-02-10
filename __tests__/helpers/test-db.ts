import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import * as schema from '@/db/schema'

const CREATE_TASKS_SQL = `
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'todo',
    priority INTEGER NOT NULL DEFAULT 1,
    date TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )
`

const CREATE_NOTES_SQL = `
  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    tags TEXT DEFAULT '[]',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )
`

export function createTestDb() {
  const sqlite = new Database(':memory:')
  sqlite.run(CREATE_TASKS_SQL)
  sqlite.run(CREATE_NOTES_SQL)
  const db = drizzle(sqlite, { schema })
  return { db, sqlite }
}

export function resetTestDb(sqlite: Database) {
  sqlite.run('DELETE FROM tasks')
  sqlite.run('DELETE FROM notes')
}
