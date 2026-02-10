import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test'
import '../helpers/component-setup'

import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { AddTask } from '@/components/tasks/AddTask'

afterEach(cleanup)

describe('AddTask', () => {
  let onAdd: ReturnType<typeof mock>

  beforeEach(() => {
    onAdd = mock(() => {})
  })

  test('renders input field with placeholder', () => {
    render(<AddTask onAdd={onAdd} />)
    expect(screen.getByPlaceholderText('Add a task...')).toBeTruthy()
  })

  test('renders Add button', () => {
    render(<AddTask onAdd={onAdd} />)
    expect(screen.getByText('Add')).toBeTruthy()
  })

  test('renders three priority buttons', () => {
    render(<AddTask onAdd={onAdd} />)
    expect(screen.getByLabelText('Low priority')).toBeTruthy()
    expect(screen.getByLabelText('Medium priority')).toBeTruthy()
    expect(screen.getByLabelText('High priority')).toBeTruthy()
  })

  test('default priority is low (priority 1)', () => {
    render(<AddTask onAdd={onAdd} />)
    const lowBtn = screen.getByLabelText('Low priority')
    expect(lowBtn.getAttribute('aria-pressed')).toBe('true')
  })

  test('calls onAdd with text and default priority on submit', () => {
    render(<AddTask onAdd={onAdd} />)
    const input = screen.getByPlaceholderText('Add a task...')
    fireEvent.change(input, { target: { value: 'New task' } })
    fireEvent.click(screen.getByText('Add'))
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onAdd).toHaveBeenCalledWith('New task', 1)
  })

  test('calls onAdd with selected priority', () => {
    render(<AddTask onAdd={onAdd} />)
    const input = screen.getByPlaceholderText('Add a task...')
    fireEvent.change(input, { target: { value: 'Urgent task' } })
    fireEvent.click(screen.getByLabelText('High priority'))
    fireEvent.click(screen.getByText('Add'))
    expect(onAdd).toHaveBeenCalledWith('Urgent task', 3)
  })

  test('does not call onAdd with empty text', () => {
    render(<AddTask onAdd={onAdd} />)
    fireEvent.click(screen.getByText('Add'))
    expect(onAdd).not.toHaveBeenCalled()
  })

  test('clears input after submission', () => {
    render(<AddTask onAdd={onAdd} />)
    const input = screen.getByPlaceholderText('Add a task...') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Task text' } })
    fireEvent.click(screen.getByText('Add'))
    expect(input.value).toBe('')
  })

  test('resets priority to low after submission', () => {
    render(<AddTask onAdd={onAdd} />)
    const input = screen.getByPlaceholderText('Add a task...')
    fireEvent.change(input, { target: { value: 'Task' } })
    fireEvent.click(screen.getByLabelText('High priority'))
    fireEvent.click(screen.getByText('Add'))
    // After submit, priority should reset to 1 (low)
    const lowBtn = screen.getByLabelText('Low priority')
    expect(lowBtn.getAttribute('aria-pressed')).toBe('true')
  })
})
