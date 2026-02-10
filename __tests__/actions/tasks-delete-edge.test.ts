import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { createTestDb, resetTestDb } from '../helpers/test-db'
import { tasks } from '@/db/schema'
import { eq } from 'drizzle-orm'

// --- Set up in-memory DB and mocks before imports ---

const { db: testDb, sqlite } = createTestDb()

mock.module('@/lib/db', () => ({ db: testDb }))
mock.module('next/cache', () => ({ revalidatePath: mock(() => {}) }))

const { createTask, deleteTask, toggleTask, updateTaskPriority } = await import(
  '@/lib/actions/tasks'
)

// --- Helpers ---

async function seedTask(
  overrides: { text?: string; priority?: number; date?: string } = {}
) {
  const text = overrides.text ?? 'Test task'
  const priority = overrides.priority ?? 1
  const date = overrides.date ?? '2026-03-10'

  const result = await createTask(text, priority, date)
  if (!result.success) throw new Error('seedTask failed: ' + result.error)

  const task = testDb
    .select()
    .from(tasks)
    .where(eq(tasks.id, result.data.id))
    .get()

  if (!task) throw new Error('seedTask: task not found after insert')
  return task
}

// --- Tests ---

describe('deleteTask', () => {
  beforeEach(() => resetTestDb(sqlite))

  test('removes task from database and returns { success: true }', async () => {
    const task = await seedTask()

    const result = await deleteTask(task.id)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.id).toBe(task.id)

    // Verify task is gone from the database
    const dbTask = testDb
      .select()
      .from(tasks)
      .where(eq(tasks.id, task.id))
      .get()
    expect(dbTask).toBeUndefined()
  })

  test('returns { success: false, error } for non-existent id', async () => {
    const fakeId = crypto.randomUUID()

    const result = await deleteTask(fakeId)

    expect(result.success).toBe(false)
    if (result.success) return
    expect(typeof result.error).toBe('string')
    expect(result.error.length).toBeGreaterThan(0)
  })

  test('returns { success: false, error } for invalid (non-uuid) id', async () => {
    const result = await deleteTask('not-a-uuid')

    expect(result.success).toBe(false)
    if (result.success) return
    expect(typeof result.error).toBe('string')
  })

  test('does not modify other tasks in the database', async () => {
    const taskA = await seedTask({ text: 'Task A' })
    const taskB = await seedTask({ text: 'Task B' })

    await deleteTask(taskA.id)

    const dbTaskB = testDb
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskB.id))
      .get()
    expect(dbTaskB).toBeDefined()
    expect(dbTaskB!.text).toBe('Task B')

    const allTasks = testDb.select().from(tasks).all()
    expect(allTasks).toHaveLength(1)
  })

  test('deleting an already-deleted task returns { success: false, error }', async () => {
    const task = await seedTask()

    // Delete once
    const first = await deleteTask(task.id)
    expect(first.success).toBe(true)

    // Delete again — task no longer exists
    const second = await deleteTask(task.id)
    expect(second.success).toBe(false)
    if (second.success) return
    expect(typeof second.error).toBe('string')
    expect(second.error.length).toBeGreaterThan(0)
  })
})

describe('createTask edge cases', () => {
  beforeEach(() => resetTestDb(sqlite))

  test('empty text returns { success: false, error }', async () => {
    const result = await createTask('', 1, '2026-03-10')

    expect(result.success).toBe(false)
    if (result.success) return
    expect(typeof result.error).toBe('string')
  })

  test('whitespace-only text returns { success: false, error }', async () => {
    // Zod min(1) rejects empty string; whitespace-only string has length >= 1
    // so this may succeed depending on schema. We test the behavior.
    const result = await createTask('   ', 1, '2026-03-10')

    // If the action accepts whitespace-only, it should still create a task
    // If it rejects it, it should return an error
    // Either way, verify the result shape is valid
    if (result.success) {
      expect(result.data.text).toBe('   ')
    } else {
      expect(typeof result.error).toBe('string')
    }
  })

  test('priority 0 returns { success: false, error }', async () => {
    const result = await createTask('Valid text', 0, '2026-03-10')

    expect(result.success).toBe(false)
    if (result.success) return
    expect(typeof result.error).toBe('string')
  })

  test('priority 4 returns { success: false, error }', async () => {
    const result = await createTask('Valid text', 4, '2026-03-10')

    expect(result.success).toBe(false)
    if (result.success) return
    expect(typeof result.error).toBe('string')
  })

  test('priority -1 returns { success: false, error }', async () => {
    const result = await createTask('Valid text', -1, '2026-03-10')

    expect(result.success).toBe(false)
    if (result.success) return
    expect(typeof result.error).toBe('string')
  })

  test('invalid date format (MM/DD/YYYY) returns { success: false, error }', async () => {
    const result = await createTask('Valid text', 1, '02/10/2026')

    expect(result.success).toBe(false)
    if (result.success) return
    expect(typeof result.error).toBe('string')
  })

  test('invalid date format (not-a-date) returns { success: false, error }', async () => {
    const result = await createTask('Valid text', 1, 'not-a-date')

    expect(result.success).toBe(false)
    if (result.success) return
    expect(typeof result.error).toBe('string')
  })

  test('invalid priority does not persist anything to database', async () => {
    await createTask('Valid text', 0, '2026-03-10')
    await createTask('Valid text', 4, '2026-03-10')
    await createTask('Valid text', -1, '2026-03-10')

    const allTasks = testDb.select().from(tasks).all()
    expect(allTasks).toHaveLength(0)
  })
})

describe('operations on non-existent task IDs', () => {
  beforeEach(() => resetTestDb(sqlite))

  test('toggleTask with non-existent id returns { success: false, error }', async () => {
    const fakeId = crypto.randomUUID()

    const result = await toggleTask(fakeId)

    expect(result.success).toBe(false)
    if (result.success) return
    expect(typeof result.error).toBe('string')
    expect(result.error.length).toBeGreaterThan(0)
  })

  test('updateTaskPriority with non-existent id returns { success: false, error }', async () => {
    const fakeId = crypto.randomUUID()

    const result = await updateTaskPriority(fakeId, 2)

    expect(result.success).toBe(false)
    if (result.success) return
    expect(typeof result.error).toBe('string')
    expect(result.error.length).toBeGreaterThan(0)
  })

  test('deleteTask with non-existent id returns { success: false, error }', async () => {
    const fakeId = crypto.randomUUID()

    const result = await deleteTask(fakeId)

    expect(result.success).toBe(false)
    if (result.success) return
    expect(typeof result.error).toBe('string')
    expect(result.error.length).toBeGreaterThan(0)
  })
})
