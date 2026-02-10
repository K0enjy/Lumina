import { Database } from 'bun:sqlite'
import { drizzle, type BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import { mock } from 'bun:test'
import * as schema from '@/db/schema'
import { tasks } from '@/db/schema'

// --- SQL to create tables matching db/schema.ts ---

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

// --- Types ---

type Task = typeof tasks.$inferSelect
type TaskInsertOverrides = Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>

type TestDb = {
  db: BunSQLiteDatabase<typeof schema>
  sqlite: Database
}

// --- Mock next/cache so Server Actions don't throw ---

mock.module('next/cache', () => ({
  revalidatePath: () => {},
}))

// --- Setup / Teardown ---

/**
 * Creates a fresh in-memory SQLite database with the full schema applied.
 * Call once per test suite (in beforeAll or at module scope).
 * Returns the Drizzle db instance and the underlying bun:sqlite Database.
 */
export function setupTestDb(): TestDb {
  const sqlite = new Database(':memory:')
  sqlite.run(CREATE_TASKS_SQL)
  sqlite.run(CREATE_NOTES_SQL)
  const db = drizzle(sqlite, { schema })
  return { db, sqlite }
}

/**
 * Deletes all rows from the tasks table. Use in beforeEach for test isolation.
 */
export function clearTasks(db: BunSQLiteDatabase<typeof schema>): void {
  db.delete(tasks).run()
}

/**
 * Inserts a task with sensible defaults. Override any field via the overrides parameter.
 * Returns the inserted task row.
 */
export function seedTask(
  db: BunSQLiteDatabase<typeof schema>,
  overrides?: TaskInsertOverrides
): Task {
  const now = Date.now()
  const values = {
    id: crypto.randomUUID(),
    text: 'Test task',
    status: 'todo' as const,
    priority: 1,
    date: '2026-02-10',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }

  const [inserted] = db.insert(tasks).values(values).returning().all()
  return inserted
}
