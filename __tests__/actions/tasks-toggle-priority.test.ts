import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { createTestDb, resetTestDb } from '../helpers/test-db'
import { tasks } from '@/db/schema'
import { eq } from 'drizzle-orm'

// --- Set up in-memory DB and mocks before imports ---

const { db: testDb, sqlite } = createTestDb()

mock.module('@/lib/db', () => ({ db: testDb }))
mock.module('next/cache', () => ({ revalidatePath: mock(() => {}) }))

const { createTask, toggleTask, updateTaskPriority } = await import(
  '@/lib/actions/tasks'
)

// --- Helpers ---

async function seedTask(
  overrides: { text?: string; priority?: number; date?: string; status?: 'todo' | 'done' } = {}
) {
  const text = overrides.text ?? 'Test task'
  const priority = overrides.priority ?? 1
  const date = overrides.date ?? '2026-03-10'

  const result = await createTask(text, priority, date)
  if (!result.success) throw new Error('seedTask failed: ' + result.error)

  // If a non-default status is requested, toggle the task
  if (overrides.status === 'done') {
    await toggleTask(result.data.id)
  }

  // Re-read from DB to get current state
  const task = testDb
    .select()
    .from(tasks)
    .where(eq(tasks.id, result.data.id))
    .get()

  if (!task) throw new Error('seedTask: task not found after insert')
  return task
}

// --- Tests ---

describe('toggleTask', () => {
  beforeEach(() => resetTestDb(sqlite))

  test('flips status from todo to done and returns { success: true }', async () => {
    const task = await seedTask({ status: 'todo' })

    const result = await toggleTask(task.id)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.status).toBe('done')
  })

  test('flips status from done back to todo', async () => {
    const task = await seedTask({ status: 'done' })
    expect(task.status).toBe('done')

    const result = await toggleTask(task.id)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.status).toBe('todo')
  })

  test('updates the updatedAt timestamp', async () => {
    const task = await seedTask()
    const originalUpdatedAt = task.updatedAt

    // Small delay to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 10))

    const result = await toggleTask(task.id)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.updatedAt).toBeGreaterThan(originalUpdatedAt)

    // Verify in database directly
    const dbTask = testDb
      .select()
      .from(tasks)
      .where(eq(tasks.id, task.id))
      .get()
    expect(dbTask).toBeDefined()
    expect(dbTask!.updatedAt).toBeGreaterThan(originalUpdatedAt)
  })

  test('returns { success: false, error } for non-existent id', async () => {
    const fakeId = crypto.randomUUID()

    const result = await toggleTask(fakeId)

    expect(result.success).toBe(false)
    if (result.success) return
    expect(typeof result.error).toBe('string')
    expect(result.error.length).toBeGreaterThan(0)
  })

  test('returns { success: false, error } for invalid (non-uuid) id', async () => {
    const result = await toggleTask('not-a-uuid')

    expect(result.success).toBe(false)
    if (result.success) return
    expect(typeof result.error).toBe('string')
  })

  test('does not modify other tasks in the database', async () => {
    const taskA = await seedTask({ text: 'Task A' })
    const taskB = await seedTask({ text: 'Task B' })

    await toggleTask(taskA.id)

    const dbTaskB = testDb
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskB.id))
      .get()
    expect(dbTaskB).toBeDefined()
    expect(dbTaskB!.status).toBe('todo')
    expect(dbTaskB!.updatedAt).toBe(taskB.updatedAt)
  })

  test('persists toggled status in the database', async () => {
    const task = await seedTask()

    await toggleTask(task.id)

    const dbTask = testDb
      .select()
      .from(tasks)
      .where(eq(tasks.id, task.id))
      .get()
    expect(dbTask).toBeDefined()
    expect(dbTask!.status).toBe('done')
  })
})

describe('updateTaskPriority', () => {
  beforeEach(() => resetTestDb(sqlite))

  test('changes priority to 1', async () => {
    const task = await seedTask({ priority: 2 })

    const result = await updateTaskPriority(task.id, 1)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.priority).toBe(1)
  })

  test('changes priority to 2', async () => {
    const task = await seedTask({ priority: 1 })

    const result = await updateTaskPriority(task.id, 2)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.priority).toBe(2)
  })

  test('changes priority to 3', async () => {
    const task = await seedTask({ priority: 1 })

    const result = await updateTaskPriority(task.id, 3)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.priority).toBe(3)
  })

  test('updates the updatedAt timestamp', async () => {
    const task = await seedTask()
    const originalUpdatedAt = task.updatedAt

    // Small delay to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 10))

    const result = await updateTaskPriority(task.id, 3)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.updatedAt).toBeGreaterThan(originalUpdatedAt)

    // Verify in database directly
    const dbTask = testDb
      .select()
      .from(tasks)
      .where(eq(tasks.id, task.id))
      .get()
    expect(dbTask).toBeDefined()
    expect(dbTask!.updatedAt).toBeGreaterThan(originalUpdatedAt)
  })

  test('returns { success: false, error } for non-existent id', async () => {
    const fakeId = crypto.randomUUID()

    const result = await updateTaskPriority(fakeId, 2)

    expect(result.success).toBe(false)
    if (result.success) return
    expect(typeof result.error).toBe('string')
    expect(result.error.length).toBeGreaterThan(0)
  })

  test('returns { success: false, error } for invalid (non-uuid) id', async () => {
    const result = await updateTaskPriority('not-a-uuid', 2)

    expect(result.success).toBe(false)
    if (result.success) return
    expect(typeof result.error).toBe('string')
  })

  test('persists updated priority in the database', async () => {
    const task = await seedTask({ priority: 1 })

    await updateTaskPriority(task.id, 3)

    const dbTask = testDb
      .select()
      .from(tasks)
      .where(eq(tasks.id, task.id))
      .get()
    expect(dbTask).toBeDefined()
    expect(dbTask!.priority).toBe(3)
  })

  test('does not modify other tasks in the database', async () => {
    const taskA = await seedTask({ text: 'Task A', priority: 1 })
    const taskB = await seedTask({ text: 'Task B', priority: 1 })

    await updateTaskPriority(taskA.id, 3)

    const dbTaskB = testDb
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskB.id))
      .get()
    expect(dbTaskB).toBeDefined()
    expect(dbTaskB!.priority).toBe(1)
    expect(dbTaskB!.updatedAt).toBe(taskB.updatedAt)
  })
})
