/**
 * Mock implementations for Server Actions used in component tests.
 *
 * Server Actions (files marked 'use server') cannot execute in Bun's test
 * runner because they rely on the Next.js server runtime. This module
 * provides mock.module() calls that replace every exported action with a
 * controllable mock function.
 *
 * Usage: import this file at the top of component test files that render
 * components which call Server Actions directly.
 *
 *   import '../mocks/actions'
 *
 * To customise return values in a specific test:
 *
 *   import { mockToggleTask } from '../mocks/actions'
 *   mockToggleTask.mockImplementationOnce(() =>
 *     Promise.resolve({ success: false, error: 'Task not found' })
 *   )
 */
import { mock } from 'bun:test'

// ---------------------------------------------------------------------------
// Task Action mocks
// ---------------------------------------------------------------------------

export const mockCreateTask = mock(() =>
  Promise.resolve({
    success: true as const,
    data: {
      id: crypto.randomUUID(),
      text: 'Mock task',
      status: 'todo' as const,
      priority: 1,
      date: '2026-02-10',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  })
)

export const mockToggleTask = mock(() =>
  Promise.resolve({
    success: true as const,
    data: {
      id: crypto.randomUUID(),
      text: 'Mock task',
      status: 'done' as const,
      priority: 1,
      date: '2026-02-10',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  })
)

export const mockUpdateTaskPriority = mock(() =>
  Promise.resolve({
    success: true as const,
    data: {
      id: crypto.randomUUID(),
      text: 'Mock task',
      status: 'todo' as const,
      priority: 2,
      date: '2026-02-10',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  })
)

export const mockDeleteTask = mock(() =>
  Promise.resolve({ success: true as const, data: { id: 'mock-id' } })
)

export const mockGetTasksByDate = mock(() => Promise.resolve([]))

export const mockArchiveCompletedTasks = mock(() =>
  Promise.resolve({ success: true as const, data: { archivedCount: 0 } })
)

mock.module('@/lib/actions/tasks', () => ({
  createTask: mockCreateTask,
  toggleTask: mockToggleTask,
  updateTaskPriority: mockUpdateTaskPriority,
  deleteTask: mockDeleteTask,
  getTasksByDate: mockGetTasksByDate,
  archiveCompletedTasks: mockArchiveCompletedTasks,
}))

// ---------------------------------------------------------------------------
// Note Action mocks
// ---------------------------------------------------------------------------

export const mockCreateNote = mock(() =>
  Promise.resolve({
    success: true as const,
    data: {
      id: crypto.randomUUID(),
      title: 'Mock note',
      content: '',
      tags: '[]',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  })
)

export const mockUpdateNote = mock(() =>
  Promise.resolve({
    success: true as const,
    data: {
      id: crypto.randomUUID(),
      title: 'Mock note',
      content: 'Updated content',
      tags: '[]',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  })
)

export const mockDeleteNote = mock(() =>
  Promise.resolve({ success: true as const, data: { id: 'mock-id' } })
)

export const mockGetNotes = mock(() => Promise.resolve([]))

export const mockGetNoteById = mock(() => Promise.resolve(undefined))

export const mockSaveNoteContent = mock(() =>
  Promise.resolve({
    success: true as const,
    data: {
      id: crypto.randomUUID(),
      title: 'Mock note',
      content: 'Saved content',
      tags: '[]',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  })
)

mock.module('@/lib/actions/notes', () => ({
  createNote: mockCreateNote,
  updateNote: mockUpdateNote,
  deleteNote: mockDeleteNote,
  getNotes: mockGetNotes,
  getNoteById: mockGetNoteById,
  saveNoteContent: mockSaveNoteContent,
}))

// ---------------------------------------------------------------------------
// Search Action mocks
// ---------------------------------------------------------------------------

export const mockSearchAll = mock(() =>
  Promise.resolve({ success: true as const, data: [] })
)

mock.module('@/lib/actions/search', () => ({
  searchAll: mockSearchAll,
}))
