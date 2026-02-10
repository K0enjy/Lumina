import { describe, test, expect, mock, afterEach, beforeEach } from 'bun:test'
import '../../helpers/component-setup'
import { createTestDb, resetTestDb } from '../../helpers/test-db'

// Mock db and next/cache so server actions don't crash
const { db: testDb, sqlite } = createTestDb()
mock.module('@/lib/db', () => ({ db: testDb }))
mock.module('next/cache', () => ({ revalidatePath: mock(() => {}) }))

import { render, screen, cleanup } from '@testing-library/react'
import { TaskList } from '@/components/tasks/TaskList'

afterEach(cleanup)
beforeEach(() => resetTestDb(sqlite))

function makeTask(overrides: Record<string, unknown> = {}) {
  return {
    id: 'task-1',
    text: 'Default task',
    status: 'todo' as const,
    priority: 1,
    date: '2026-02-10',
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  }
}

describe('TaskList rendering', () => {
  test('renders empty state message when tasks array is empty', () => {
    render(<TaskList tasks={[]} />)
    expect(screen.getByText('No tasks for today')).toBeTruthy()
  })

  test('renders correct number of task items matching input array length', () => {
    const taskData = [
      makeTask({ id: 't1', text: 'Task one' }),
      makeTask({ id: 't2', text: 'Task two' }),
      makeTask({ id: 't3', text: 'Task three' }),
    ]
    const { container } = render(<TaskList tasks={taskData} />)

    // Each TaskItem renders a span.flex-1 for the task text
    const taskElements = container.querySelectorAll('span.flex-1')
    expect(taskElements.length).toBe(3)
  })

  test('does not show empty state message when tasks are provided', () => {
    const taskData = [makeTask({ id: 't1', text: 'A task' })]
    render(<TaskList tasks={taskData} />)
    expect(screen.queryByText('No tasks for today')).toBeNull()
  })

  test('each task title text is visible in the rendered output', () => {
    const taskData = [
      makeTask({ id: 't1', text: 'Buy groceries' }),
      makeTask({ id: 't2', text: 'Walk the dog' }),
      makeTask({ id: 't3', text: 'Write tests' }),
      makeTask({ id: 't4', text: 'Review PR' }),
    ]
    render(<TaskList tasks={taskData} />)

    expect(screen.getByText('Buy groceries')).toBeTruthy()
    expect(screen.getByText('Walk the dog')).toBeTruthy()
    expect(screen.getByText('Write tests')).toBeTruthy()
    expect(screen.getByText('Review PR')).toBeTruthy()
  })

  test('tasks are rendered in correct order: pending sorted by priority desc', () => {
    const taskData = [
      makeTask({ id: 't1', text: 'Low priority task', priority: 1, createdAt: 1000 }),
      makeTask({ id: 't2', text: 'High priority task', priority: 3, createdAt: 1000 }),
      makeTask({ id: 't3', text: 'Medium priority task', priority: 2, createdAt: 1000 }),
    ]
    const { container } = render(<TaskList tasks={taskData} />)

    const taskTexts = Array.from(
      container.querySelectorAll('span.flex-1')
    ).map((el) => el.textContent)

    expect(taskTexts[0]).toBe('High priority task')
    expect(taskTexts[1]).toBe('Medium priority task')
    expect(taskTexts[2]).toBe('Low priority task')
  })

  test('done tasks are rendered after pending tasks', () => {
    const taskData = [
      makeTask({ id: 't1', text: 'Pending task', status: 'todo', priority: 1 }),
      makeTask({ id: 't2', text: 'Done task', status: 'done', priority: 3, updatedAt: 2000 }),
    ]
    const { container } = render(<TaskList tasks={taskData} />)

    const taskTexts = Array.from(
      container.querySelectorAll('span.flex-1')
    ).map((el) => el.textContent)

    expect(taskTexts[0]).toBe('Pending task')
    expect(taskTexts[1]).toBe('Done task')
  })

  test('renders single task correctly', () => {
    const taskData = [makeTask({ id: 't1', text: 'Only task' })]
    const { container } = render(<TaskList tasks={taskData} />)

    const taskElements = container.querySelectorAll('span.flex-1')
    expect(taskElements.length).toBe(1)
    expect(screen.getByText('Only task')).toBeTruthy()
  })
})
