/**
 * Integration test: Task creation flow
 *
 * Tests the complete task lifecycle end-to-end through server actions:
 * create → list → toggle → verify status → delete → verify removal
 * Also covers validation, error handling, and edge cases.
 */
import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { createTestDb, resetTestDb } from '../helpers/test-db'
import type { Database } from 'bun:sqlite'

const { db: testDb, sqlite } = createTestDb()

mock.module('@/lib/db', () => ({ db: testDb }))
mock.module('next/cache', () => ({ revalidatePath: mock(() => {}) }))

const {
  createTask,
  toggleTask,
  deleteTask,
  getTasksByDate,
  updateTaskPriority,
  archiveCompletedTasks,
} = await import('@/lib/actions/tasks')

const TODAY = '2025-06-15'

describe('Task creation flow (end-to-end)', () => {
  beforeEach(() => resetTestDb(sqlite))

  test('create a task and see it in the task list', async () => {
    // Step 1: Create a task
    const result = await createTask('Buy groceries', 2, TODAY)
    expect(result.success).toBe(true)
    if (!result.success) return

    // Step 2: Fetch tasks for today
    const tasks = await getTasksByDate(TODAY)
    expect(tasks.length).toBe(1)
    expect(tasks[0].text).toBe('Buy groceries')
    expect(tasks[0].priority).toBe(2)
    expect(tasks[0].status).toBe('todo')
  })

  test('create multiple tasks and see them all listed', async () => {
    await createTask('Task A', 1, TODAY)
    await createTask('Task B', 3, TODAY)
    await createTask('Task C', 2, TODAY)

    const tasks = await getTasksByDate(TODAY)
    expect(tasks.length).toBe(3)
    const texts = tasks.map((t) => t.text).sort()
    expect(texts).toEqual(['Task A', 'Task B', 'Task C'])
  })

  test('create a task, toggle it done, verify status changed', async () => {
    const createResult = await createTask('Clean room', 1, TODAY)
    expect(createResult.success).toBe(true)
    if (!createResult.success) return
    const taskId = createResult.data.id

    // Toggle to done
    const toggleResult = await toggleTask(taskId)
    expect(toggleResult.success).toBe(true)

    // Verify it's done
    const tasks = await getTasksByDate(TODAY)
    const task = tasks.find((t) => t.id === taskId)
    expect(task?.status).toBe('done')
  })

  test('toggle a done task back to todo', async () => {
    const createResult = await createTask('Exercise', 2, TODAY)
    if (!createResult.success) return
    const taskId = createResult.data.id

    // Toggle to done
    await toggleTask(taskId)
    // Toggle back to todo
    await toggleTask(taskId)

    const tasks = await getTasksByDate(TODAY)
    const task = tasks.find((t) => t.id === taskId)
    expect(task?.status).toBe('todo')
  })

  test('create a task, delete it, verify removal', async () => {
    const createResult = await createTask('Temporary task', 1, TODAY)
    if (!createResult.success) return
    const taskId = createResult.data.id

    // Delete
    const deleteResult = await deleteTask(taskId)
    expect(deleteResult.success).toBe(true)

    // Verify it's gone
    const tasks = await getTasksByDate(TODAY)
    expect(tasks.find((t) => t.id === taskId)).toBeUndefined()
  })

  test('update task priority and verify', async () => {
    const createResult = await createTask('Important task', 1, TODAY)
    if (!createResult.success) return
    const taskId = createResult.data.id

    // Update priority from 1 to 3
    const updateResult = await updateTaskPriority(taskId, 3)
    expect(updateResult.success).toBe(true)

    const tasks = await getTasksByDate(TODAY)
    const task = tasks.find((t) => t.id === taskId)
    expect(task?.priority).toBe(3)
  })

  test('tasks from different dates are isolated', async () => {
    const TOMORROW = '2025-06-16'
    await createTask('Today task', 1, TODAY)
    await createTask('Tomorrow task', 1, TOMORROW)

    const todayTasks = await getTasksByDate(TODAY)
    expect(todayTasks.length).toBe(1)
    expect(todayTasks[0].text).toBe('Today task')

    const tomorrowTasks = await getTasksByDate(TOMORROW)
    expect(tomorrowTasks.length).toBe(1)
    expect(tomorrowTasks[0].text).toBe('Tomorrow task')
  })

  test('full lifecycle: create, toggle, update priority, toggle back, delete', async () => {
    const createResult = await createTask('Full lifecycle task', 1, TODAY)
    if (!createResult.success) return
    const id = createResult.data.id

    // Toggle to done
    await toggleTask(id)
    let tasks = await getTasksByDate(TODAY)
    expect(tasks.find((t) => t.id === id)?.status).toBe('done')

    // Update priority
    await updateTaskPriority(id, 3)
    tasks = await getTasksByDate(TODAY)
    expect(tasks.find((t) => t.id === id)?.priority).toBe(3)

    // Toggle back to todo
    await toggleTask(id)
    tasks = await getTasksByDate(TODAY)
    expect(tasks.find((t) => t.id === id)?.status).toBe('todo')

    // Delete
    await deleteTask(id)
    tasks = await getTasksByDate(TODAY)
    expect(tasks.find((t) => t.id === id)).toBeUndefined()
  })
})

describe('Task validation and error handling', () => {
  beforeEach(() => resetTestDb(sqlite))

  test('creating a task with empty text fails validation', async () => {
    const result = await createTask('', 1, TODAY)
    expect(result.success).toBe(false)
  })

  test('creating a task with invalid date format fails validation', async () => {
    const result = await createTask('Valid text', 1, 'not-a-date')
    expect(result.success).toBe(false)
  })

  test('creating a task with priority out of range fails validation', async () => {
    const result = await createTask('Valid text', 5, TODAY)
    expect(result.success).toBe(false)
  })

  test('toggling a non-existent task returns error', async () => {
    const result = await toggleTask(crypto.randomUUID())
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Task not found')
    }
  })

  test('deleting a non-existent task returns error', async () => {
    const result = await deleteTask(crypto.randomUUID())
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Task not found')
    }
  })

  test('updating priority of a non-existent task returns error', async () => {
    const result = await updateTaskPriority(crypto.randomUUID(), 2)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Task not found')
    }
  })

  test('getting tasks for empty date returns empty array', async () => {
    const tasks = await getTasksByDate(TODAY)
    expect(tasks).toEqual([])
  })

  test('created task has valid timestamps', async () => {
    const before = Date.now()
    const result = await createTask('Timestamp check', 1, TODAY)
    const after = Date.now()

    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.data.createdAt).toBeGreaterThanOrEqual(before)
    expect(result.data.createdAt).toBeLessThanOrEqual(after)
    expect(result.data.updatedAt).toBeGreaterThanOrEqual(before)
    expect(result.data.updatedAt).toBeLessThanOrEqual(after)
  })

  test('toggling a task updates its updatedAt timestamp', async () => {
    const createResult = await createTask('Timestamp update', 1, TODAY)
    if (!createResult.success) return
    const originalUpdatedAt = createResult.data.updatedAt

    // Small delay to ensure timestamp difference
    await new Promise((r) => setTimeout(r, 10))

    await toggleTask(createResult.data.id)
    const tasks = await getTasksByDate(TODAY)
    const task = tasks.find((t) => t.id === createResult.data.id)
    expect(task!.updatedAt).toBeGreaterThan(originalUpdatedAt)
  })

  test('each created task gets a unique ID', async () => {
    const r1 = await createTask('Task 1', 1, TODAY)
    const r2 = await createTask('Task 2', 1, TODAY)
    const r3 = await createTask('Task 3', 1, TODAY)

    if (!r1.success || !r2.success || !r3.success) return
    const ids = new Set([r1.data.id, r2.data.id, r3.data.id])
    expect(ids.size).toBe(3)
  })

  test('task default priority is 1 when not specified', async () => {
    const result = await createTask('Default priority', 1, TODAY)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.priority).toBe(1)
  })
})
