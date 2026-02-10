import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test'
import '../../helpers/component-setup'
import '../../mocks/actions'

import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskItem } from '@/components/tasks/TaskItem'

afterEach(cleanup)

function makeTask(overrides: Partial<Parameters<typeof TaskItem>[0]['task']> = {}) {
  return {
    id: 'task-abc-123',
    text: 'Write unit tests',
    status: 'todo' as const,
    priority: 1,
    date: '2026-02-10',
    createdAt: 1739145600000,
    updatedAt: 1739145600000,
    ...overrides,
  }
}

describe('TaskItem checkbox interaction', () => {
  let onToggle: ReturnType<typeof mock>
  let onDelete: ReturnType<typeof mock>

  beforeEach(() => {
    onToggle = mock(() => {})
    onDelete = mock(() => {})
  })

  test('clicking checkbox calls onToggle with the correct task ID', async () => {
    const user = userEvent.setup()
    render(<TaskItem task={makeTask()} onToggle={onToggle} onDelete={onDelete} />)

    await user.click(screen.getByLabelText('Mark as complete'))

    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(onToggle).toHaveBeenCalledWith('task-abc-123')
  })

  test('clicking checkbox on a done task calls onToggle with the correct task ID', async () => {
    const user = userEvent.setup()
    render(
      <TaskItem
        task={makeTask({ id: 'task-done-456', status: 'done' })}
        onToggle={onToggle}
        onDelete={onDelete}
      />
    )

    await user.click(screen.getByLabelText('Mark as incomplete'))

    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(onToggle).toHaveBeenCalledWith('task-done-456')
  })

  test('clicking delete button calls onDelete with the correct task ID', async () => {
    const user = userEvent.setup()
    render(<TaskItem task={makeTask()} onToggle={onToggle} onDelete={onDelete} />)

    await user.click(screen.getByLabelText('Delete task'))

    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledWith('task-abc-123')
  })
})

describe('TaskItem priority dot display', () => {
  const onToggle = mock(() => {})
  const onDelete = mock(() => {})

  test('priority 1 task renders element with bg-green-400 class', () => {
    const { container } = render(
      <TaskItem task={makeTask({ priority: 1 })} onToggle={onToggle} onDelete={onDelete} />
    )

    const dot = container.querySelector('.bg-green-400')
    expect(dot).not.toBeNull()
    expect(dot!.classList.contains('rounded-full')).toBe(true)
  })

  test('priority 2 task renders element with bg-yellow-400 class', () => {
    const { container } = render(
      <TaskItem task={makeTask({ priority: 2 })} onToggle={onToggle} onDelete={onDelete} />
    )

    const dot = container.querySelector('.bg-yellow-400')
    expect(dot).not.toBeNull()
    expect(dot!.classList.contains('rounded-full')).toBe(true)
  })

  test('priority 3 task renders element with bg-red-400 class', () => {
    const { container } = render(
      <TaskItem task={makeTask({ priority: 3 })} onToggle={onToggle} onDelete={onDelete} />
    )

    const dot = container.querySelector('.bg-red-400')
    expect(dot).not.toBeNull()
    expect(dot!.classList.contains('rounded-full')).toBe(true)
  })

  test('priority dot has correct size classes (w-2 h-2)', () => {
    const { container } = render(
      <TaskItem task={makeTask({ priority: 2 })} onToggle={onToggle} onDelete={onDelete} />
    )

    const dot = container.querySelector('.bg-yellow-400')
    expect(dot).not.toBeNull()
    expect(dot!.classList.contains('w-2')).toBe(true)
    expect(dot!.classList.contains('h-2')).toBe(true)
  })
})

describe('TaskItem completed task visual distinction', () => {
  const onToggle = mock(() => {})
  const onDelete = mock(() => {})

  test('completed task (status done) renders with line-through on text', () => {
    render(
      <TaskItem
        task={makeTask({ status: 'done' })}
        onToggle={onToggle}
        onDelete={onDelete}
      />
    )

    const textEl = screen.getByText('Write unit tests')
    expect(textEl.className).toContain('line-through')
  })

  test('completed task renders text with secondary color class', () => {
    render(
      <TaskItem
        task={makeTask({ status: 'done' })}
        onToggle={onToggle}
        onDelete={onDelete}
      />
    )

    const textEl = screen.getByText('Write unit tests')
    expect(textEl.className).toContain('text-[var(--text-secondary)]')
  })

  test('todo task does not render with line-through', () => {
    render(
      <TaskItem
        task={makeTask({ status: 'todo' })}
        onToggle={onToggle}
        onDelete={onDelete}
      />
    )

    const textEl = screen.getByText('Write unit tests')
    expect(textEl.className).not.toContain('line-through')
  })

  test('completed task checkbox shows filled accent background', () => {
    render(
      <TaskItem
        task={makeTask({ status: 'done' })}
        onToggle={onToggle}
        onDelete={onDelete}
      />
    )

    const checkbox = screen.getByLabelText('Mark as incomplete')
    expect(checkbox.className).toContain('bg-[var(--accent)]')
  })

  test('todo task checkbox does not show filled accent background', () => {
    render(
      <TaskItem
        task={makeTask({ status: 'todo' })}
        onToggle={onToggle}
        onDelete={onDelete}
      />
    )

    const checkbox = screen.getByLabelText('Mark as complete')
    expect(checkbox.className).not.toContain('bg-[var(--accent)]')
  })
})
