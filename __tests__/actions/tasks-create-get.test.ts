import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { createTestDb, resetTestDb } from '../helpers/test-db'
import { tasks } from '@/db/schema'
import { eq } from 'drizzle-orm'

// --- Set up in-memory DB and mocks before imports ---

const { db: testDb, sqlite } = createTestDb()

mock.module('@/lib/db', () => ({ db: testDb }))
mock.module('next/cache', () => ({ revalidatePath: mock(() => {}) }))

const { createTask, getTasksByDate } = await import('@/lib/actions/tasks')

// --- Constants ---

const DATE_A = '2026-03-10'
const DATE_B = '2026-03-11'
const DATE_C = '2026-03-12'

// --- UUID regex ---

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

// --- Tests ---

describe('createTask', () => {
  beforeEach(() => resetTestDb(sqlite))

  test('returns { success: true, data } with UUID id, status todo, correct priority and date', async () => {
    const result = await createTask('Write unit tests', 2, DATE_A)

    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.data.id).toMatch(UUID_REGEX)
    expect(result.data.text).toBe('Write unit tests')
    expect(result.data.status).toBe('todo')
    expect(result.data.priority).toBe(2)
    expect(result.data.date).toBe(DATE_A)
    expect(result.data.createdAt).toBeGreaterThan(0)
    expect(result.data.updatedAt).toBeGreaterThan(0)
  })

  test('stores the task in the database (verified via direct db query)', async () => {
    const result = await createTask('Persisted task', 3, DATE_A)
    expect(result.success).toBe(true)
    if (!result.success) return

    const rows = testDb
      .select()
      .from(tasks)
      .where(eq(tasks.id, result.data.id))
      .all()

    expect(rows).toHaveLength(1)
    expect(rows[0].text).toBe('Persisted task')
    expect(rows[0].status).toBe('todo')
    expect(rows[0].priority).toBe(3)
    expect(rows[0].date).toBe(DATE_A)
    expect(rows[0].id).toBe(result.data.id)
    expect(rows[0].createdAt).toBe(result.data.createdAt)
    expect(rows[0].updatedAt).toBe(result.data.updatedAt)
  })

  test('sets createdAt and updatedAt to the same value on creation', async () => {
    const result = await createTask('Timestamp check', 1, DATE_A)
    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.data.createdAt).toBe(result.data.updatedAt)
  })

  test('returns success for each valid priority (1, 2, 3)', async () => {
    for (const priority of [1, 2, 3]) {
      resetTestDb(sqlite)
      const result = await createTask(`Priority ${priority}`, priority, DATE_A)
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data.priority).toBe(priority)
    }
  })

  test('generates unique IDs for consecutive tasks', async () => {
    const r1 = await createTask('Task A', 1, DATE_A)
    const r2 = await createTask('Task B', 1, DATE_A)
    expect(r1.success && r2.success).toBe(true)
    if (!r1.success || !r2.success) return
    expect(r1.data.id).not.toBe(r2.data.id)
  })
})

describe('getTasksByDate', () => {
  beforeEach(() => resetTestDb(sqlite))

  test('returns tasks matching the queried date only', async () => {
    await createTask('Task for A', 1, DATE_A)
    await createTask('Task for B', 2, DATE_B)

    const result = await getTasksByDate(DATE_A)

    expect(result).toHaveLength(1)
    expect(result[0].text).toBe('Task for A')
    expect(result[0].date).toBe(DATE_A)
  })

  test('returns empty array when no tasks exist for that date', async () => {
    const result = await getTasksByDate('2099-12-31')
    expect(result).toHaveLength(0)
    expect(result).toEqual([])
  })

  test('returns empty array when db has tasks but none for queried date', async () => {
    await createTask('Other date task', 1, DATE_A)

    const result = await getTasksByDate(DATE_B)
    expect(result).toHaveLength(0)
  })

  test('filters correctly when multiple tasks exist for different dates', async () => {
    await createTask('Task A-1', 1, DATE_A)
    await createTask('Task A-2', 2, DATE_A)
    await createTask('Task B-1', 1, DATE_B)
    await createTask('Task C-1', 3, DATE_C)
    await createTask('Task C-2', 1, DATE_C)

    const tasksA = await getTasksByDate(DATE_A)
    expect(tasksA).toHaveLength(2)
    expect(tasksA.every((t) => t.date === DATE_A)).toBe(true)
    const textsA = tasksA.map((t) => t.text).sort()
    expect(textsA).toEqual(['Task A-1', 'Task A-2'])

    const tasksB = await getTasksByDate(DATE_B)
    expect(tasksB).toHaveLength(1)
    expect(tasksB[0].text).toBe('Task B-1')

    const tasksC = await getTasksByDate(DATE_C)
    expect(tasksC).toHaveLength(2)
    expect(tasksC.every((t) => t.date === DATE_C)).toBe(true)
  })

  test('returns all fields for each task', async () => {
    const created = await createTask('Full field check', 2, DATE_A)
    expect(created.success).toBe(true)
    if (!created.success) return

    const result = await getTasksByDate(DATE_A)
    expect(result).toHaveLength(1)

    const task = result[0]
    expect(task.id).toMatch(UUID_REGEX)
    expect(task.text).toBe('Full field check')
    expect(task.status).toBe('todo')
    expect(task.priority).toBe(2)
    expect(task.date).toBe(DATE_A)
    expect(task.createdAt).toBeGreaterThan(0)
    expect(task.updatedAt).toBeGreaterThan(0)
  })
})
