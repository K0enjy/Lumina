import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { createTestDb, resetTestDb } from '../helpers/test-db'
import { tasks } from '@/db/schema'
import { eq } from 'drizzle-orm'

// --- Set up in-memory DB and mocks before imports ---

const { db: testDb, sqlite } = createTestDb()

mock.module('@/lib/db', () => ({ db: testDb }))
mock.module('next/cache', () => ({ revalidatePath: mock(() => {}) }))

const { createTask, toggleTask, archiveCompletedTasks } = await import(
  '@/lib/actions/tasks'
)

// --- Helpers ---

const TODAY = new Date().toISOString().split('T')[0]

function pastDate(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

function futureDate(daysAhead: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return d.toISOString().split('T')[0]
}

async function seedTask(
  overrides: { text?: string; priority?: number; date?: string } = {}
) {
  const text = overrides.text ?? 'Test task'
  const priority = overrides.priority ?? 1
  const date = overrides.date ?? TODAY

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

async function seedDoneTask(
  overrides: { text?: string; priority?: number; date?: string } = {}
) {
  const task = await seedTask(overrides)
  await toggleTask(task.id)
  return task
}

// --- Tests ---

describe('archiveCompletedTasks — date scenarios', () => {
  beforeEach(() => resetTestDb(sqlite))

  test('archives completed tasks from previous dates', async () => {
    const task = await seedDoneTask({ date: pastDate(1) })

    const result = await archiveCompletedTasks()

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.archivedCount).toBe(1)

    // Verify task is removed from database
    const dbTask = testDb
      .select()
      .from(tasks)
      .where(eq(tasks.id, task.id))
      .get()
    expect(dbTask).toBeUndefined()
  })

  test('archives completed tasks from multiple past dates', async () => {
    await seedDoneTask({ text: 'Yesterday', date: pastDate(1) })
    await seedDoneTask({ text: 'Last week', date: pastDate(7) })
    await seedDoneTask({ text: 'Last year', date: pastDate(365) })

    const result = await archiveCompletedTasks()

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.archivedCount).toBe(3)

    const remaining = testDb.select().from(tasks).all()
    expect(remaining).toHaveLength(0)
  })

  test('does NOT archive completed tasks from today', async () => {
    const task = await seedDoneTask({ date: TODAY })

    const result = await archiveCompletedTasks()

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.archivedCount).toBe(0)

    // Verify task still exists in database
    const dbTask = testDb
      .select()
      .from(tasks)
      .where(eq(tasks.id, task.id))
      .get()
    expect(dbTask).toBeDefined()
    expect(dbTask!.status).toBe('done')
  })

  test('does NOT archive tasks with todo status regardless of date — past', async () => {
    const task = await seedTask({ date: pastDate(30) })

    const result = await archiveCompletedTasks()

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.archivedCount).toBe(0)

    const dbTask = testDb
      .select()
      .from(tasks)
      .where(eq(tasks.id, task.id))
      .get()
    expect(dbTask).toBeDefined()
    expect(dbTask!.status).toBe('todo')
  })

  test('does NOT archive tasks with todo status regardless of date — today', async () => {
    const task = await seedTask({ date: TODAY })

    const result = await archiveCompletedTasks()

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.archivedCount).toBe(0)

    const dbTask = testDb
      .select()
      .from(tasks)
      .where(eq(tasks.id, task.id))
      .get()
    expect(dbTask).toBeDefined()
    expect(dbTask!.status).toBe('todo')
  })

  test('does NOT archive tasks with todo status regardless of date — future', async () => {
    const task = await seedTask({ date: futureDate(10) })

    const result = await archiveCompletedTasks()

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.archivedCount).toBe(0)

    const dbTask = testDb
      .select()
      .from(tasks)
      .where(eq(tasks.id, task.id))
      .get()
    expect(dbTask).toBeDefined()
    expect(dbTask!.status).toBe('todo')
  })

  test('does NOT archive completed tasks for future dates', async () => {
    const task = await seedDoneTask({ date: futureDate(1) })

    const result = await archiveCompletedTasks()

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.archivedCount).toBe(0)

    const dbTask = testDb
      .select()
      .from(tasks)
      .where(eq(tasks.id, task.id))
      .get()
    expect(dbTask).toBeDefined()
    expect(dbTask!.status).toBe('done')
  })

  test('does NOT archive completed tasks for far future dates', async () => {
    const task = await seedDoneTask({ date: '2099-12-31' })

    const result = await archiveCompletedTasks()

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.archivedCount).toBe(0)

    const dbTask = testDb
      .select()
      .from(tasks)
      .where(eq(tasks.id, task.id))
      .get()
    expect(dbTask).toBeDefined()
  })
})

describe('archiveCompletedTasks — idempotency', () => {
  beforeEach(() => resetTestDb(sqlite))

  test('running archive twice does not double-archive', async () => {
    await seedDoneTask({ text: 'Old done', date: pastDate(5) })

    const first = await archiveCompletedTasks()
    expect(first.success).toBe(true)
    if (!first.success) return
    expect(first.data.archivedCount).toBe(1)

    const second = await archiveCompletedTasks()
    expect(second.success).toBe(true)
    if (!second.success) return
    expect(second.data.archivedCount).toBe(0)

    const remaining = testDb.select().from(tasks).all()
    expect(remaining).toHaveLength(0)
  })

  test('running archive three times is stable', async () => {
    await seedDoneTask({ text: 'Past done 1', date: pastDate(2) })
    await seedDoneTask({ text: 'Past done 2', date: pastDate(10) })
    await seedTask({ text: 'Today todo', date: TODAY })

    const first = await archiveCompletedTasks()
    expect(first.success).toBe(true)
    if (!first.success) return
    expect(first.data.archivedCount).toBe(2)

    const second = await archiveCompletedTasks()
    expect(second.success).toBe(true)
    if (!second.success) return
    expect(second.data.archivedCount).toBe(0)

    const third = await archiveCompletedTasks()
    expect(third.success).toBe(true)
    if (!third.success) return
    expect(third.data.archivedCount).toBe(0)

    // Only the todo task from today should remain
    const remaining = testDb.select().from(tasks).all()
    expect(remaining).toHaveLength(1)
    expect(remaining[0].text).toBe('Today todo')
    expect(remaining[0].status).toBe('todo')
  })

  test('returns 0 when called on empty database', async () => {
    const result = await archiveCompletedTasks()
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.archivedCount).toBe(0)
  })
})

describe('archiveCompletedTasks — mixed scenarios', () => {
  beforeEach(() => resetTestDb(sqlite))

  test('archives only eligible tasks in a mixed set', async () => {
    // Should be archived: completed + past date
    const archivable1 = await seedDoneTask({
      text: 'Done yesterday',
      date: pastDate(1),
    })
    const archivable2 = await seedDoneTask({
      text: 'Done last week',
      date: pastDate(7),
    })

    // Should NOT be archived: completed but today
    const todayDone = await seedDoneTask({
      text: 'Done today',
      date: TODAY,
    })

    // Should NOT be archived: completed but future
    const futureDone = await seedDoneTask({
      text: 'Done future',
      date: futureDate(3),
    })

    // Should NOT be archived: todo status (any date)
    const pastTodo = await seedTask({
      text: 'Todo past',
      date: pastDate(5),
    })
    const todayTodo = await seedTask({
      text: 'Todo today',
      date: TODAY,
    })
    const futureTodo = await seedTask({
      text: 'Todo future',
      date: futureDate(5),
    })

    const result = await archiveCompletedTasks()

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.archivedCount).toBe(2)

    // Verify archived tasks are gone
    expect(
      testDb
        .select()
        .from(tasks)
        .where(eq(tasks.id, archivable1.id))
        .get()
    ).toBeUndefined()
    expect(
      testDb
        .select()
        .from(tasks)
        .where(eq(tasks.id, archivable2.id))
        .get()
    ).toBeUndefined()

    // Verify non-archivable tasks remain
    expect(
      testDb.select().from(tasks).where(eq(tasks.id, todayDone.id)).get()
    ).toBeDefined()
    expect(
      testDb.select().from(tasks).where(eq(tasks.id, futureDone.id)).get()
    ).toBeDefined()
    expect(
      testDb.select().from(tasks).where(eq(tasks.id, pastTodo.id)).get()
    ).toBeDefined()
    expect(
      testDb.select().from(tasks).where(eq(tasks.id, todayTodo.id)).get()
    ).toBeDefined()
    expect(
      testDb.select().from(tasks).where(eq(tasks.id, futureTodo.id)).get()
    ).toBeDefined()

    const remaining = testDb.select().from(tasks).all()
    expect(remaining).toHaveLength(5)
  })

  test('preserves task data for non-archived tasks', async () => {
    const task = await seedTask({
      text: 'Important todo',
      priority: 3,
      date: pastDate(2),
    })

    await archiveCompletedTasks()

    const dbTask = testDb
      .select()
      .from(tasks)
      .where(eq(tasks.id, task.id))
      .get()
    expect(dbTask).toBeDefined()
    expect(dbTask!.text).toBe('Important todo')
    expect(dbTask!.priority).toBe(3)
    expect(dbTask!.status).toBe('todo')
    expect(dbTask!.date).toBe(pastDate(2))
  })
})
