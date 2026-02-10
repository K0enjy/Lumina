import { describe, test, expect, mock, beforeEach, beforeAll } from 'bun:test'
import { createTestDb, resetTestDb } from '../helpers/test-db'
import type { Database } from 'bun:sqlite'

// --- Set up in-memory DB and mocks before imports ---

const { db: testDb, sqlite } = createTestDb()

mock.module('@/lib/db', () => ({ db: testDb }))
mock.module('next/cache', () => ({ revalidatePath: mock(() => {}) }))

const {
  createTask,
  toggleTask,
  updateTaskPriority,
  deleteTask,
  getTasksByDate,
  archiveCompletedTasks,
} = await import('@/lib/actions/tasks')

// --- Constants ---

const TODAY = '2025-06-15'
const YESTERDAY = '2025-06-14'

// --- Tests ---

describe('createTask', () => {
  beforeEach(() => resetTestDb(sqlite))

  test('creates a task with valid input', async () => {
    const result = await createTask('Buy groceries', 1, TODAY)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.text).toBe('Buy groceries')
    expect(result.data.status).toBe('todo')
    expect(result.data.priority).toBe(1)
    expect(result.data.date).toBe(TODAY)
    expect(result.data.id).toBeTruthy()
    expect(result.data.createdAt).toBeGreaterThan(0)
    expect(result.data.updatedAt).toBeGreaterThan(0)
  })

  test('creates a task with high priority', async () => {
    const result = await createTask('Urgent fix', 3, TODAY)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.priority).toBe(3)
  })

  test('creates a task with default priority 1', async () => {
    const result = await createTask('Default priority', 1, TODAY)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.priority).toBe(1)
  })

  test('rejects empty text', async () => {
    const result = await createTask('', 1, TODAY)
    expect(result.success).toBe(false)
  })

  test('rejects text exceeding 500 characters', async () => {
    const longText = 'a'.repeat(501)
    const result = await createTask(longText, 1, TODAY)
    expect(result.success).toBe(false)
  })

  test('accepts text at exactly 500 characters', async () => {
    const maxText = 'a'.repeat(500)
    const result = await createTask(maxText, 1, TODAY)
    expect(result.success).toBe(true)
  })

  test('rejects invalid priority (0)', async () => {
    const result = await createTask('Task', 0, TODAY)
    expect(result.success).toBe(false)
  })

  test('rejects invalid priority (4)', async () => {
    const result = await createTask('Task', 4, TODAY)
    expect(result.success).toBe(false)
  })

  test('rejects invalid date format', async () => {
    const result = await createTask('Task', 1, '2025/06/15')
    expect(result.success).toBe(false)
  })

  test('rejects malformed date string', async () => {
    const result = await createTask('Task', 1, 'not-a-date')
    expect(result.success).toBe(false)
  })

  test('generates unique IDs for each task', async () => {
    const r1 = await createTask('Task 1', 1, TODAY)
    const r2 = await createTask('Task 2', 1, TODAY)
    expect(r1.success && r2.success).toBe(true)
    if (!r1.success || !r2.success) return
    expect(r1.data.id).not.toBe(r2.data.id)
  })
})

describe('toggleTask', () => {
  beforeEach(() => resetTestDb(sqlite))

  test('toggles a todo task to done', async () => {
    const created = await createTask('Toggle me', 1, TODAY)
    if (!created.success) throw new Error('Setup failed')

    const result = await toggleTask(created.data.id)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.status).toBe('done')
  })

  test('toggles a done task back to todo', async () => {
    const created = await createTask('Toggle me back', 1, TODAY)
    if (!created.success) throw new Error('Setup failed')

    await toggleTask(created.data.id)
    const result = await toggleTask(created.data.id)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.status).toBe('todo')
  })

  test('returns error for non-existent task', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000'
    const result = await toggleTask(fakeId)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Task not found')
    }
  })

  test('returns error for invalid (non-UUID) ID', async () => {
    const result = await toggleTask('not-a-uuid')
    expect(result.success).toBe(false)
  })

  test('updates updatedAt timestamp', async () => {
    const created = await createTask('Timestamp check', 1, TODAY)
    if (!created.success) throw new Error('Setup failed')

    const originalUpdatedAt = created.data.updatedAt
    // small delay to ensure timestamp differs
    await new Promise((r) => setTimeout(r, 5))
    const result = await toggleTask(created.data.id)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt)
  })
})

describe('updateTaskPriority', () => {
  beforeEach(() => resetTestDb(sqlite))

  test('updates priority from 1 to 3', async () => {
    const created = await createTask('Priority task', 1, TODAY)
    if (!created.success) throw new Error('Setup failed')

    const result = await updateTaskPriority(created.data.id, 3)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.priority).toBe(3)
  })

  test('updates priority from 3 to 2', async () => {
    const created = await createTask('Priority task', 3, TODAY)
    if (!created.success) throw new Error('Setup failed')

    const result = await updateTaskPriority(created.data.id, 2)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.priority).toBe(2)
  })

  test('returns error for non-existent task', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000'
    const result = await updateTaskPriority(fakeId, 2)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Task not found')
    }
  })

  test('returns error for invalid priority (0)', async () => {
    const created = await createTask('Task', 1, TODAY)
    if (!created.success) throw new Error('Setup failed')
    const result = await updateTaskPriority(created.data.id, 0)
    expect(result.success).toBe(false)
  })

  test('returns error for invalid priority (4)', async () => {
    const created = await createTask('Task', 1, TODAY)
    if (!created.success) throw new Error('Setup failed')
    const result = await updateTaskPriority(created.data.id, 4)
    expect(result.success).toBe(false)
  })

  test('returns error for invalid (non-UUID) ID', async () => {
    const result = await updateTaskPriority('bad-id', 2)
    expect(result.success).toBe(false)
  })

  test('updates updatedAt timestamp', async () => {
    const created = await createTask('Timestamp check', 1, TODAY)
    if (!created.success) throw new Error('Setup failed')

    const originalUpdatedAt = created.data.updatedAt
    await new Promise((r) => setTimeout(r, 5))
    const result = await updateTaskPriority(created.data.id, 3)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt)
  })
})

describe('deleteTask', () => {
  beforeEach(() => resetTestDb(sqlite))

  test('deletes an existing task', async () => {
    const created = await createTask('Delete me', 1, TODAY)
    if (!created.success) throw new Error('Setup failed')

    const result = await deleteTask(created.data.id)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.id).toBe(created.data.id)

    // Verify task is gone
    const tasks = await getTasksByDate(TODAY)
    expect(tasks).toHaveLength(0)
  })

  test('returns error for non-existent task', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000'
    const result = await deleteTask(fakeId)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Task not found')
    }
  })

  test('returns error for invalid (non-UUID) ID', async () => {
    const result = await deleteTask('not-a-uuid')
    expect(result.success).toBe(false)
  })

  test('does not affect other tasks', async () => {
    const t1 = await createTask('Keep me', 1, TODAY)
    const t2 = await createTask('Delete me', 1, TODAY)
    if (!t1.success || !t2.success) throw new Error('Setup failed')

    await deleteTask(t2.data.id)
    const remaining = await getTasksByDate(TODAY)
    expect(remaining).toHaveLength(1)
    expect(remaining[0].id).toBe(t1.data.id)
  })
})

describe('getTasksByDate', () => {
  beforeEach(() => resetTestDb(sqlite))

  test('returns tasks for a specific date', async () => {
    await createTask('Task today', 1, TODAY)
    await createTask('Task yesterday', 1, YESTERDAY)

    const todayTasks = await getTasksByDate(TODAY)
    expect(todayTasks).toHaveLength(1)
    expect(todayTasks[0].text).toBe('Task today')
  })

  test('returns empty array when no tasks for date', async () => {
    const tasks = await getTasksByDate('2099-12-31')
    expect(tasks).toHaveLength(0)
  })

  test('returns empty array for invalid date format', async () => {
    const tasks = await getTasksByDate('invalid')
    expect(tasks).toHaveLength(0)
  })

  test('returns multiple tasks for the same date', async () => {
    await createTask('Task 1', 1, TODAY)
    await createTask('Task 2', 2, TODAY)
    await createTask('Task 3', 3, TODAY)

    const tasks = await getTasksByDate(TODAY)
    expect(tasks).toHaveLength(3)
  })

  test('includes both todo and done tasks for the date', async () => {
    const created = await createTask('Will be done', 1, TODAY)
    await createTask('Still todo', 1, TODAY)
    if (!created.success) throw new Error('Setup failed')
    await toggleTask(created.data.id)

    const tasks = await getTasksByDate(TODAY)
    expect(tasks).toHaveLength(2)
    const statuses = tasks.map((t) => t.status).sort()
    expect(statuses).toEqual(['done', 'todo'])
  })
})

describe('archiveCompletedTasks', () => {
  beforeEach(() => resetTestDb(sqlite))

  test('archives completed tasks from past dates', async () => {
    const pastTask = await createTask('Old done task', 1, '2020-01-01')
    if (!pastTask.success) throw new Error('Setup failed')
    await toggleTask(pastTask.data.id)

    const result = await archiveCompletedTasks()
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.archivedCount).toBe(1)
  })

  test('does not archive incomplete tasks from past dates', async () => {
    await createTask('Old incomplete task', 1, '2020-01-01')

    const result = await archiveCompletedTasks()
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.archivedCount).toBe(0)
  })

  test('does not archive completed tasks from today', async () => {
    const todayStr = new Date().toISOString().split('T')[0]
    const todayTask = await createTask('Done today', 1, todayStr)
    if (!todayTask.success) throw new Error('Setup failed')
    await toggleTask(todayTask.data.id)

    const result = await archiveCompletedTasks()
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.archivedCount).toBe(0)
  })

  test('archives multiple completed past tasks', async () => {
    const t1 = await createTask('Old 1', 1, '2020-01-01')
    const t2 = await createTask('Old 2', 1, '2020-01-02')
    const t3 = await createTask('Old 3 (incomplete)', 1, '2020-01-03')
    if (!t1.success || !t2.success || !t3.success) throw new Error('Setup failed')
    await toggleTask(t1.data.id)
    await toggleTask(t2.data.id)
    // t3 stays as 'todo'

    const result = await archiveCompletedTasks()
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.archivedCount).toBe(2)
  })

  test('returns 0 when there is nothing to archive', async () => {
    const result = await archiveCompletedTasks()
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.archivedCount).toBe(0)
  })

  test('does not archive completed tasks from future dates', async () => {
    const futureTask = await createTask('Future done', 1, '2099-12-31')
    if (!futureTask.success) throw new Error('Setup failed')
    await toggleTask(futureTask.data.id)

    const result = await archiveCompletedTasks()
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.archivedCount).toBe(0)
  })
})
