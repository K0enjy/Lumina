import { describe, test, expect, mock, afterEach, beforeEach } from 'bun:test'
import { mockPush } from '../helpers/component-setup'
import { createTestDb, resetTestDb } from '../helpers/test-db'

// Mock db and next/cache so the real server actions work
const { db: testDb, sqlite } = createTestDb()
mock.module('@/lib/db', () => ({ db: testDb }))
mock.module('next/cache', () => ({ revalidatePath: mock(() => {}) }))

import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import { CommandPalette } from '@/components/search/CommandPalette'
import { tasks, notes } from '@/db/schema'

afterEach(cleanup)

beforeEach(() => {
  resetTestDb(sqlite)
  mockPush.mockClear()

  // Seed test data for search results
  const now = Date.now()
  testDb.insert(tasks).values({
    id: 'task-1',
    text: 'Buy groceries',
    status: 'todo',
    priority: 2,
    date: '2025-06-15',
    createdAt: now,
    updatedAt: now,
  }).run()

  testDb.insert(notes).values({
    id: 'note-1',
    title: 'Meeting Notes',
    content: 'Discussion about project...',
    tags: '["work"]',
    createdAt: now,
    updatedAt: now,
  }).run()
})

// Helper to open the palette and wait for all transitions to flush
async function openAndWait() {
  await act(async () => {
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
  })
  await act(async () => {
    await new Promise((r) => setTimeout(r, 200))
  })
}

describe('CommandPalette', () => {
  test('is not visible by default', () => {
    render(<CommandPalette />)
    expect(screen.queryByPlaceholderText('Search tasks and notes...')).toBeNull()
  })

  test('opens on Ctrl+K and shows search input', async () => {
    render(<CommandPalette />)
    await openAndWait()
    expect(screen.getByPlaceholderText('Search tasks and notes...')).toBeTruthy()
  })

  test('renders search results with section headers', async () => {
    render(<CommandPalette />)
    await openAndWait()
    expect(screen.getByText('Tasks')).toBeTruthy()
    expect(screen.getByText('Notes')).toBeTruthy()
  })

  test('displays task result title', async () => {
    render(<CommandPalette />)
    await openAndWait()
    expect(screen.getByText('Buy groceries')).toBeTruthy()
  })

  test('displays note result title and preview', async () => {
    render(<CommandPalette />)
    await openAndWait()
    expect(screen.getByText('Meeting Notes')).toBeTruthy()
    expect(screen.getByText('Discussion about project...')).toBeTruthy()
  })

  test('navigates to / when task result is clicked', async () => {
    render(<CommandPalette />)
    await openAndWait()
    await act(async () => {
      fireEvent.click(screen.getByText('Buy groceries'))
    })
    expect(mockPush).toHaveBeenCalledWith('/')
  })

  test('navigates to /notes/:id when note result is clicked', async () => {
    render(<CommandPalette />)
    await openAndWait()
    await act(async () => {
      fireEvent.click(screen.getByText('Meeting Notes'))
    })
    expect(mockPush).toHaveBeenCalledWith('/notes/note-1')
  })

  test('shows keyboard shortcut hints in footer', async () => {
    render(<CommandPalette />)
    await openAndWait()
    expect(screen.getByText('navigate')).toBeTruthy()
    expect(screen.getByText('open')).toBeTruthy()
    expect(screen.getByText('close')).toBeTruthy()
  })

  test('renders backdrop overlay when open', async () => {
    render(<CommandPalette />)
    await openAndWait()
    const backdrop = document.querySelector('.backdrop-blur-sm')
    expect(backdrop).toBeTruthy()
  })

  test('shows empty state hint when no query and no recent items', async () => {
    resetTestDb(sqlite) // Clear all data
    render(<CommandPalette />)
    await openAndWait()
    expect(screen.getByText('Type to search tasks and notes...')).toBeTruthy()
  })

  test('closes on Escape key', async () => {
    render(<CommandPalette />)
    await openAndWait()
    expect(screen.getByPlaceholderText('Search tasks and notes...')).toBeTruthy()

    await act(async () => {
      const input = screen.getByPlaceholderText('Search tasks and notes...')
      fireEvent.keyDown(input, { key: 'Escape' })
    })

    expect(screen.queryByPlaceholderText('Search tasks and notes...')).toBeNull()
  })

  test('closes on backdrop click', async () => {
    render(<CommandPalette />)
    await openAndWait()
    expect(screen.getByPlaceholderText('Search tasks and notes...')).toBeTruthy()

    const backdrop = document.querySelector('.backdrop-blur-sm')
    await act(async () => {
      fireEvent.click(backdrop!)
    })

    expect(screen.queryByPlaceholderText('Search tasks and notes...')).toBeNull()
  })

  test('filters results when typing a search query', async () => {
    // Add a second task that won't match
    const now = Date.now()
    testDb.insert(tasks).values({
      id: 'task-2',
      text: 'Clean the house',
      status: 'todo',
      priority: 1,
      date: '2025-06-15',
      createdAt: now,
      updatedAt: now,
    }).run()

    render(<CommandPalette />)
    await openAndWait()

    // Both tasks should be visible as recent items
    expect(screen.getByText('Buy groceries')).toBeTruthy()
    expect(screen.getByText('Clean the house')).toBeTruthy()

    // Type a search query
    const input = screen.getByPlaceholderText('Search tasks and notes...')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'groceries' } })
    })
    // Wait for debounce
    await act(async () => {
      await new Promise((r) => setTimeout(r, 300))
    })

    // Only the matching task should be visible
    expect(screen.getByText('Buy groceries')).toBeTruthy()
    expect(screen.queryByText('Clean the house')).toBeNull()
  })

  test('shows "No results found" for non-matching search', async () => {
    render(<CommandPalette />)
    await openAndWait()

    const input = screen.getByPlaceholderText('Search tasks and notes...')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'xyz-nonexistent' } })
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 300))
    })

    expect(screen.getByText('No results found')).toBeTruthy()
  })

  test('toggles open/closed with repeated Ctrl+K', async () => {
    render(<CommandPalette />)

    // Open
    await openAndWait()
    expect(screen.getByPlaceholderText('Search tasks and notes...')).toBeTruthy()

    // Close
    await act(async () => {
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    })
    expect(screen.queryByPlaceholderText('Search tasks and notes...')).toBeNull()
  })

  test('opens with Cmd+K (macOS)', async () => {
    render(<CommandPalette />)
    await act(async () => {
      fireEvent.keyDown(document, { key: 'k', metaKey: true })
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200))
    })
    expect(screen.getByPlaceholderText('Search tasks and notes...')).toBeTruthy()
  })

  test('displays task priority dot in results', async () => {
    render(<CommandPalette />)
    await openAndWait()
    // Task with priority 2 should have yellow dot
    const yellowDot = document.querySelector('.bg-yellow-400')
    expect(yellowDot).toBeTruthy()
  })

  test('results show type labels', async () => {
    render(<CommandPalette />)
    await openAndWait()
    expect(screen.getByText('Task')).toBeTruthy()
    expect(screen.getByText('Note')).toBeTruthy()
  })
})
