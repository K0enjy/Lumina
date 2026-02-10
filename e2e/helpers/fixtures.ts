import { test as base } from '@playwright/test'
import { randomUUID } from 'crypto'
import { createTestDatabase, cleanupTestDatabase } from './db-setup'

export { TEST_DB_PATH, cleanupTestDatabase } from './db-setup'

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
  {
    id: randomUUID(),
    text: 'Write documentation',
    status: 'todo' as const,
    priority: 2,
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
  const db = createTestDatabase()

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
  cleanupTestDatabase()
}

export const test = base
export { expect } from '@playwright/test'
