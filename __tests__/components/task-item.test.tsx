import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test'
import '../helpers/component-setup'

import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { TaskItem } from '@/components/tasks/TaskItem'

afterEach(cleanup)

// --- Helpers ---

function makeTask(overrides: Partial<Parameters<typeof TaskItem>[0]['task']> = {}) {
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

describe('TaskItem', () => {
  let onToggle: ReturnType<typeof mock>
  let onDelete: ReturnType<typeof mock>

  beforeEach(() => {
    onToggle = mock(() => {})
    onDelete = mock(() => {})
  })

  test('renders task text', () => {
    render(<TaskItem task={makeTask()} onToggle={onToggle} onDelete={onDelete} />)
    expect(screen.getByText('Buy groceries')).toBeTruthy()
  })

  test('renders checkbox with correct aria-label for todo task', () => {
    render(<TaskItem task={makeTask()} onToggle={onToggle} onDelete={onDelete} />)
    expect(screen.getByLabelText('Mark as complete')).toBeTruthy()
  })

  test('renders checkbox with correct aria-label for done task', () => {
    render(
      <TaskItem
        task={makeTask({ status: 'done' })}
        onToggle={onToggle}
        onDelete={onDelete}
      />
    )
    expect(screen.getByLabelText('Mark as incomplete')).toBeTruthy()
  })

  test('applies strikethrough for done task', () => {
    render(
      <TaskItem
        task={makeTask({ status: 'done' })}
        onToggle={onToggle}
        onDelete={onDelete}
      />
    )
    const textEl = screen.getByText('Buy groceries')
    expect(textEl.className).toContain('line-through')
  })

  test('does not apply strikethrough for todo task', () => {
    render(<TaskItem task={makeTask()} onToggle={onToggle} onDelete={onDelete} />)
    const textEl = screen.getByText('Buy groceries')
    expect(textEl.className).not.toContain('line-through')
  })

  test('calls onToggle with task id when checkbox clicked', () => {
    render(<TaskItem task={makeTask()} onToggle={onToggle} onDelete={onDelete} />)
    fireEvent.click(screen.getByLabelText('Mark as complete'))
    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(onToggle).toHaveBeenCalledWith('task-1')
  })

  test('calls onDelete with task id when delete button clicked', () => {
    render(<TaskItem task={makeTask()} onToggle={onToggle} onDelete={onDelete} />)
    fireEvent.click(screen.getByLabelText('Delete task'))
    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledWith('task-1')
  })

  test('renders priority dot with green color for priority 1', () => {
    const { container } = render(
      <TaskItem task={makeTask({ priority: 1 })} onToggle={onToggle} onDelete={onDelete} />
    )
    const dot = container.querySelector('.bg-green-400')
    expect(dot).toBeTruthy()
  })

  test('renders priority dot with yellow color for priority 2', () => {
    const { container } = render(
      <TaskItem task={makeTask({ priority: 2 })} onToggle={onToggle} onDelete={onDelete} />
    )
    const dot = container.querySelector('.bg-yellow-400')
    expect(dot).toBeTruthy()
  })

  test('renders priority dot with red color for priority 3', () => {
    const { container } = render(
      <TaskItem task={makeTask({ priority: 3 })} onToggle={onToggle} onDelete={onDelete} />
    )
    const dot = container.querySelector('.bg-red-400')
    expect(dot).toBeTruthy()
  })
})
