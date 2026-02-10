import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import os from 'os'

export const TEST_DB_PATH = path.join(os.tmpdir(), 'lumina-e2e-test.sqlite')

export function createTestDatabase(): Database.Database {
  try {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
  } catch {
    // File may be locked from a previous run
  }

  const db = new Database(TEST_DB_PATH)

  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id text PRIMARY KEY NOT NULL,
      text text NOT NULL,
      status text DEFAULT 'todo' NOT NULL,
      priority integer DEFAULT 1 NOT NULL,
      date text NOT NULL,
      created_at integer NOT NULL,
      updated_at integer NOT NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id text PRIMARY KEY NOT NULL,
      title text NOT NULL,
      content text DEFAULT '',
      tags text DEFAULT '[]',
      created_at integer NOT NULL,
      updated_at integer NOT NULL
    )
  `)

  return db
}

export function cleanupTestDatabase(): void {
  try {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
  } catch {
    // File may still be locked by the dev server process on Windows
  }
}
