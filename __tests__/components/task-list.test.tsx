import { describe, test, expect, mock, afterEach, beforeEach } from 'bun:test'
import '../helpers/component-setup'
import { createTestDb, resetTestDb } from '../helpers/test-db'

// Mock db and next/cache so the real server actions work but use in-memory DB
const { db: testDb, sqlite } = createTestDb()
mock.module('@/lib/db', () => ({ db: testDb }))
mock.module('next/cache', () => ({ revalidatePath: mock(() => {}) }))

import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import { TaskList } from '@/components/tasks/TaskList'
import { tasks } from '@/db/schema'

afterEach(cleanup)
beforeEach(() => resetTestDb(sqlite))

function makeTask(overrides: Record<string, unknown> = {}) {
  return {
    id: 'task-1',
    text: 'Buy groceries',
    status: 'todo' as const,
    priority: 1,
    date: '2025-06-15',
    createdAt: 1718400000000,
    updatedAt: 1718400000000,
    ...overrides,
  }
}

// Seed a task into the DB so server actions can find it
function seedTask(overrides: Record<string, unknown> = {}) {
  const task = makeTask(overrides)
  testDb.insert(tasks).values(task).run()
  return task
}

describe('TaskList', () => {
  test('renders empty state when no tasks', () => {
    render(<TaskList tasks={[]} />)
    expect(screen.getByText('No tasks for today')).toBeTruthy()
  })

  test('renders task items for provided tasks', () => {
    const taskData = [
      makeTask({ id: 't1', text: 'First task' }),
      makeTask({ id: 't2', text: 'Second task' }),
    ]
    render(<TaskList tasks={taskData} />)
    expect(screen.getByText('First task')).toBeTruthy()
    expect(screen.getByText('Second task')).toBeTruthy()
  })

  test('renders AddTask component', () => {
    render(<TaskList tasks={[]} />)
    expect(screen.getByPlaceholderText('Add a task...')).toBeTruthy()
  })

  test('sorts tasks by priority (high first)', () => {
    const taskData = [
      makeTask({ id: 't1', text: 'Low priority', priority: 1 }),
      makeTask({ id: 't2', text: 'High priority', priority: 3 }),
      makeTask({ id: 't3', text: 'Medium priority', priority: 2 }),
    ]
    const { container } = render(<TaskList tasks={taskData} />)
    const taskTexts = Array.from(
      container.querySelectorAll('span.flex-1')
    ).map((el) => el.textContent)
    expect(taskTexts[0]).toBe('High priority')
    expect(taskTexts[1]).toBe('Medium priority')
    expect(taskTexts[2]).toBe('Low priority')
  })

  test('separates done tasks from pending tasks', () => {
    const taskData = [
      makeTask({ id: 't1', text: 'Pending task', status: 'todo' }),
      makeTask({
        id: 't2',
        text: 'Done task',
        status: 'done',
        updatedAt: Date.now(),
      }),
    ]
    const { container } = render(<TaskList tasks={taskData} />)
    const taskTexts = Array.from(
      container.querySelectorAll('span.flex-1')
    ).map((el) => el.textContent)
    expect(taskTexts[0]).toBe('Pending task')
    expect(taskTexts[1]).toBe('Done task')
  })

  test('renders correct priority dot colors', () => {
    const taskData = [
      makeTask({ id: 't1', priority: 1 }),
      makeTask({ id: 't2', priority: 2 }),
      makeTask({ id: 't3', priority: 3 }),
    ]
    const { container } = render(<TaskList tasks={taskData} />)
    expect(container.querySelector('.bg-green-400')).toBeTruthy()
    expect(container.querySelector('.bg-yellow-400')).toBeTruthy()
    expect(container.querySelector('.bg-red-400')).toBeTruthy()
  })

  test('checkbox click triggers toggle action', async () => {
    // Seed the task in the DB with a valid UUID so toggleTask server action works
    const id = crypto.randomUUID()
    const task = seedTask({ id, text: 'Toggle me', status: 'todo' })
    render(<TaskList tasks={[task]} />)

    // Verify initial state — checkbox should say "Mark as complete"
    expect(screen.getByLabelText('Mark as complete')).toBeTruthy()

    // Click the checkbox
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Mark as complete'))
      await new Promise((r) => setTimeout(r, 50))
    })

    // The task should still be rendered (it doesn't get removed on toggle)
    expect(screen.getByText('Toggle me')).toBeTruthy()
  })

  test('delete button is rendered for each task', () => {
    const taskData = [
      makeTask({ id: 't1', text: 'First task' }),
      makeTask({ id: 't2', text: 'Second task' }),
    ]
    render(<TaskList tasks={taskData} />)

    // Each task should have a delete button
    const deleteButtons = screen.getAllByLabelText('Delete task')
    expect(deleteButtons.length).toBe(2)
  })

  test('each task has a checkbox toggle button', () => {
    const taskData = [
      makeTask({ id: 't1', text: 'Todo task', status: 'todo' }),
      makeTask({ id: 't2', text: 'Done task', status: 'done' }),
    ]
    render(<TaskList tasks={taskData} />)

    expect(screen.getByLabelText('Mark as complete')).toBeTruthy()
    expect(screen.getByLabelText('Mark as incomplete')).toBeTruthy()
  })

  test('renders multiple done tasks sorted by updatedAt descending', () => {
    const taskData = [
      makeTask({ id: 't1', text: 'Older done', status: 'done', updatedAt: 1000 }),
      makeTask({ id: 't2', text: 'Newer done', status: 'done', updatedAt: 2000 }),
    ]
    const { container } = render(<TaskList tasks={taskData} />)
    const taskTexts = Array.from(
      container.querySelectorAll('span.flex-1')
    ).map((el) => el.textContent)
    expect(taskTexts[0]).toBe('Newer done')
    expect(taskTexts[1]).toBe('Older done')
  })

  test('pending tasks always appear before done tasks regardless of priority', () => {
    const taskData = [
      makeTask({ id: 't1', text: 'Low pending', status: 'todo', priority: 1 }),
      makeTask({ id: 't2', text: 'High done', status: 'done', priority: 3, updatedAt: Date.now() }),
    ]
    const { container } = render(<TaskList tasks={taskData} />)
    const taskTexts = Array.from(
      container.querySelectorAll('span.flex-1')
    ).map((el) => el.textContent)
    expect(taskTexts[0]).toBe('Low pending')
    expect(taskTexts[1]).toBe('High done')
  })

  test('tasks with same priority are sorted by createdAt descending', () => {
    const taskData = [
      makeTask({ id: 't1', text: 'Older task', priority: 2, createdAt: 1000 }),
      makeTask({ id: 't2', text: 'Newer task', priority: 2, createdAt: 2000 }),
    ]
    const { container } = render(<TaskList tasks={taskData} />)
    const taskTexts = Array.from(
      container.querySelectorAll('span.flex-1')
    ).map((el) => el.textContent)
    expect(taskTexts[0]).toBe('Newer task')
    expect(taskTexts[1]).toBe('Older task')
  })

  test('renders AddTask input and priority buttons together', () => {
    render(<TaskList tasks={[]} />)
    expect(screen.getByPlaceholderText('Add a task...')).toBeTruthy()
    expect(screen.getByLabelText('Low priority')).toBeTruthy()
    expect(screen.getByLabelText('Medium priority')).toBeTruthy()
    expect(screen.getByLabelText('High priority')).toBeTruthy()
    expect(screen.getByText('Add')).toBeTruthy()
  })

  test('renders task with all three priority levels correctly', () => {
    const taskData = [
      makeTask({ id: 't1', text: 'Low task', priority: 1 }),
      makeTask({ id: 't2', text: 'Medium task', priority: 2 }),
      makeTask({ id: 't3', text: 'High task', priority: 3 }),
    ]
    const { container } = render(<TaskList tasks={taskData} />)

    // Verify all tasks rendered
    expect(screen.getByText('Low task')).toBeTruthy()
    expect(screen.getByText('Medium task')).toBeTruthy()
    expect(screen.getByText('High task')).toBeTruthy()

    // Verify priority dots exist
    expect(container.querySelector('.bg-green-400')).toBeTruthy()
    expect(container.querySelector('.bg-yellow-400')).toBeTruthy()
    expect(container.querySelector('.bg-red-400')).toBeTruthy()
  })
})
