import { describe, test, expect, mock, afterEach, beforeEach } from 'bun:test'
import '../helpers/component-setup'
import { createTestDb, resetTestDb } from '../helpers/test-db'

// Mock db and next/cache so the real server actions work
const { db: testDb, sqlite } = createTestDb()
mock.module('@/lib/db', () => ({ db: testDb }))
mock.module('next/cache', () => ({ revalidatePath: mock(() => {}) }))

// Mock ZenMode context
mock.module('@/components/zen/ZenModeContext', () => ({
  useZenMode: () => ({ isZen: false, toggleZen: mock(() => {}), exitZen: mock(() => {}) }),
}))

// Mock Tiptap editor — replace with a simple test interface
const mockEditor = {
  getMarkdown: mock(() => 'test content'),
  getHTML: mock(() => '<p>test content</p>'),
  on: mock(() => {}),
  off: mock(() => {}),
  view: { hasFocus: () => false, domAtPos: () => ({ node: document.createElement('div') }) },
  state: { selection: { anchor: 0 } },
  commands: {},
  isDestroyed: false,
  destroy: mock(() => {}),
}

mock.module('@tiptap/react', () => ({
  useEditor: () => mockEditor,
  EditorContent: ({ editor }: { editor: unknown }) => {
    const React = require('react')
    return React.createElement('div', { 'data-testid': 'editor-content' }, editor ? 'Editor loaded' : 'Loading...')
  },
}))

mock.module('@tiptap/starter-kit', () => ({
  __esModule: true,
  default: { configure: () => ({}) },
}))

mock.module('@tiptap/extension-table', () => ({
  Table: {},
  TableRow: {},
  TableCell: {},
  TableHeader: {},
}))

mock.module('@tiptap/extension-task-list', () => ({
  __esModule: true,
  default: {},
}))

mock.module('@tiptap/extension-task-item', () => ({
  __esModule: true,
  default: { configure: () => ({}) },
}))

mock.module('@tiptap/markdown', () => ({
  Markdown: { configure: () => ({}) },
}))

import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { NoteEditor } from '@/components/editor/NoteEditor'

afterEach(cleanup)
beforeEach(() => resetTestDb(sqlite))

const BASE_PROPS = {
  id: 'note-1',
  initialTitle: 'My Note Title',
  initialContent: '# Hello World\n\nSome content with #tags',
  initialTags: ['tags'],
}

describe('NoteEditor', () => {
  test('renders title input with initial value', () => {
    render(<NoteEditor {...BASE_PROPS} />)
    const titleInput = screen.getByPlaceholderText('Untitled') as HTMLInputElement
    expect(titleInput.value).toBe('My Note Title')
  })

  test('renders back link to notes', () => {
    render(<NoteEditor {...BASE_PROPS} />)
    const backLink = screen.getByText('Back to notes')
    expect(backLink).toBeTruthy()
    expect(backLink.closest('a')?.getAttribute('href')).toBe('/notes')
  })

  test('renders editor content area', () => {
    render(<NoteEditor {...BASE_PROPS} />)
    expect(screen.getByTestId('editor-content')).toBeTruthy()
    expect(screen.getByText('Editor loaded')).toBeTruthy()
  })

  test('renders initial tags', () => {
    render(<NoteEditor {...BASE_PROPS} />)
    expect(screen.getByText('#tags')).toBeTruthy()
  })

  test('renders Zen Mode toggle button', () => {
    render(<NoteEditor {...BASE_PROPS} />)
    expect(screen.getByLabelText('Toggle Zen Mode')).toBeTruthy()
  })

  test('updates title on input change', () => {
    render(<NoteEditor {...BASE_PROPS} />)
    const titleInput = screen.getByPlaceholderText('Untitled') as HTMLInputElement
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } })
    expect(titleInput.value).toBe('Updated Title')
  })

  test('shows no tags section when initialTags is empty', () => {
    render(<NoteEditor {...BASE_PROPS} initialTags={[]} />)
    const tagBadges = screen.queryAllByText(/#\w+/)
    expect(tagBadges.length).toBe(0)
  })

  test('shows save status indicator in header', () => {
    const { container } = render(<NoteEditor {...BASE_PROPS} />)
    // The save status element exists (initially idle/hidden)
    const statusEl = container.querySelector('span.text-xs')
    expect(statusEl).toBeTruthy()
  })

  test('shows "Saving..." status after title change', async () => {
    render(<NoteEditor {...BASE_PROPS} />)
    const titleInput = screen.getByPlaceholderText('Untitled') as HTMLInputElement
    fireEvent.change(titleInput, { target: { value: 'New Title' } })
    // After typing, save status should show "Saving..."
    expect(screen.getByText('Saving...')).toBeTruthy()
  })

  test('renders with multiple initial tags', () => {
    render(
      <NoteEditor
        {...BASE_PROPS}
        initialTags={['react', 'typescript', 'nextjs']}
      />
    )
    expect(screen.getByText('#react')).toBeTruthy()
    expect(screen.getByText('#typescript')).toBeTruthy()
    expect(screen.getByText('#nextjs')).toBeTruthy()
  })

  test('title input has correct placeholder', () => {
    render(<NoteEditor {...BASE_PROPS} />)
    const titleInput = screen.getByPlaceholderText('Untitled')
    expect(titleInput).toBeTruthy()
  })

  test('renders with empty initial title', () => {
    render(<NoteEditor {...BASE_PROPS} initialTitle="" />)
    const titleInput = screen.getByPlaceholderText('Untitled') as HTMLInputElement
    expect(titleInput.value).toBe('')
  })

  test('Zen Mode button has tooltip', () => {
    render(<NoteEditor {...BASE_PROPS} />)
    const zenButton = screen.getByLabelText('Toggle Zen Mode')
    expect(zenButton.getAttribute('title')).toBe('Toggle Zen Mode (Ctrl+J)')
  })

  test('back link contains arrow icon and text', () => {
    render(<NoteEditor {...BASE_PROPS} />)
    const link = screen.getByText('Back to notes').closest('a')
    expect(link).toBeTruthy()
    expect(link?.querySelector('svg')).toBeTruthy()
  })
})
