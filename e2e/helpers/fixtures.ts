import { test as base } from '@playwright/test'
import Database from 'better-sqlite3'
import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'
import os from 'os'

export const TEST_DB_PATH = path.join(os.tmpdir(), 'lumina-e2e-test.sqlite')

const today = new Date().toISOString().split('T')[0]
const now = Date.now()

export const SEED_TASKS = [
  {
    id: randomUUID(),
    text: 'Buy groceries',
    status: 'todo' as const,
    priority: 1,
    date: today,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: randomUUID(),
    text: 'Review pull request',
    status: 'todo' as const,
    priority: 3,
    date: today,
    createdAt: now,
    updatedAt: now,
  },
]

export const SEED_NOTES = [
  {
    id: randomUUID(),
    title: 'Meeting Notes',
    content: '# Standup\n- Discussed roadmap',
    tags: '[]',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: randomUUID(),
    title: 'Recipe Ideas',
    content: '# Recipes\n- Pasta carbonara',
    tags: '[]',
    createdAt: now,
    updatedAt: now,
  },
]

export function setupTestDatabase(): void {
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

  const insertTask = db.prepare(
    'INSERT INTO tasks (id, text, status, priority, date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  for (const task of SEED_TASKS) {
    insertTask.run(task.id, task.text, task.status, task.priority, task.date, task.createdAt, task.updatedAt)
  }

  const insertNote = db.prepare(
    'INSERT INTO notes (id, title, content, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  )
  for (const note of SEED_NOTES) {
    insertNote.run(note.id, note.title, note.content, note.tags, note.createdAt, note.updatedAt)
  }

  db.close()
}

export function teardownTestDatabase(): void {
  try {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
  } catch {
    // File may still be locked by the dev server process on Windows
  }
}

export const test = base
export { expect } from '@playwright/test'
