/**
 * Integration test: Search flow via command palette
 *
 * Tests that creating tasks/notes and then searching via searchAll
 * returns the correct results — simulating the command palette workflow.
 * Also covers edge cases for search behavior.
 */
import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { createTestDb, resetTestDb } from '../helpers/test-db'
import type { Database } from 'bun:sqlite'

const { db: testDb, sqlite } = createTestDb()

mock.module('@/lib/db', () => ({ db: testDb }))
mock.module('next/cache', () => ({ revalidatePath: mock(() => {}) }))

const { createTask, toggleTask } = await import('@/lib/actions/tasks')
const { createNote, saveNoteContent, deleteNote } = await import('@/lib/actions/notes')
const { searchAll } = await import('@/lib/actions/search')

const TODAY = '2025-06-15'

describe('Search flow (command palette end-to-end)', () => {
  beforeEach(() => resetTestDb(sqlite))

  test('empty query returns recent tasks and notes', async () => {
    await createTask('Recent task', 1, TODAY)
    await createNote('Recent note')

    const result = await searchAll('')
    expect(result.success).toBe(true)
    if (!result.success) return

    const taskResults = result.data.filter((r) => r.type === 'task')
    const noteResults = result.data.filter((r) => r.type === 'note')
    expect(taskResults.length).toBe(1)
    expect(noteResults.length).toBe(1)
  })

  test('search finds tasks by text', async () => {
    await createTask('Buy groceries', 1, TODAY)
    await createTask('Clean the house', 2, TODAY)

    const result = await searchAll('groceries')
    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.data.length).toBe(1)
    expect(result.data[0].type).toBe('task')
    expect(result.data[0].displayTitle).toBe('Buy groceries')
  })

  test('search finds notes by title', async () => {
    await createNote('Meeting Notes')
    await createNote('Shopping List')

    const result = await searchAll('Meeting')
    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.data.length).toBe(1)
    expect(result.data[0].type).toBe('note')
    expect(result.data[0].displayTitle).toBe('Meeting Notes')
  })

  test('search finds notes by content', async () => {
    const noteResult = await createNote('Project Ideas')
    if (!noteResult.success) return
    await saveNoteContent(
      noteResult.data.id,
      'We should use TypeScript for the backend rewrite.'
    )

    const result = await searchAll('TypeScript')
    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.data.length).toBe(1)
    expect(result.data[0].type).toBe('note')
    expect(result.data[0].displayTitle).toBe('Project Ideas')
  })

  test('search finds notes by tag', async () => {
    const noteResult = await createNote('React Guide')
    if (!noteResult.success) return
    await saveNoteContent(
      noteResult.data.id,
      'Guide to #react hooks and #typescript'
    )

    const result = await searchAll('react')
    expect(result.success).toBe(true)
    if (!result.success) return

    // Should find the note (matches both content and tag)
    const noteResults = result.data.filter((r) => r.type === 'note')
    expect(noteResults.length).toBeGreaterThanOrEqual(1)
    expect(noteResults[0].displayTitle).toBe('React Guide')
  })

  test('search is case-insensitive', async () => {
    await createTask('Buy GROCERIES', 1, TODAY)

    const result = await searchAll('groceries')
    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.data.length).toBe(1)
    expect(result.data[0].displayTitle).toBe('Buy GROCERIES')
  })

  test('search returns both tasks and notes when both match', async () => {
    await createTask('React migration', 3, TODAY)
    const noteResult = await createNote('React patterns')
    if (!noteResult.success) return

    const result = await searchAll('React')
    expect(result.success).toBe(true)
    if (!result.success) return

    const taskResults = result.data.filter((r) => r.type === 'task')
    const noteResults = result.data.filter((r) => r.type === 'note')
    expect(taskResults.length).toBe(1)
    expect(noteResults.length).toBe(1)
  })

  test('search returns empty results for non-matching query', async () => {
    await createTask('Buy groceries', 1, TODAY)
    await createNote('Meeting Notes')

    const result = await searchAll('xyz-nothing-matches')
    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.data.length).toBe(0)
  })

  test('search results include task metadata (status, priority)', async () => {
    await createTask('High priority task', 3, TODAY)

    const result = await searchAll('High priority')
    expect(result.success).toBe(true)
    if (!result.success) return

    const task = result.data[0]
    expect(task.type).toBe('task')
    if (task.type !== 'task') return
    expect(task.status).toBe('todo')
    expect(task.priority).toBe(3)
  })

  test('search results include note tags', async () => {
    const noteResult = await createNote('Tagged Note')
    if (!noteResult.success) return
    await saveNoteContent(noteResult.data.id, 'Content with #design and #ux tags')

    const result = await searchAll('Tagged')
    expect(result.success).toBe(true)
    if (!result.success) return

    const note = result.data[0]
    expect(note.type).toBe('note')
    if (note.type !== 'note') return
    expect(note.tags).toContain('design')
    expect(note.tags).toContain('ux')
  })

  test('full flow: create items, search, and verify results match', async () => {
    // Create a mix of tasks and notes
    await createTask('Write tests for search', 2, TODAY)
    await createTask('Deploy to production', 3, TODAY)
    const noteResult = await createNote('Search Architecture')
    if (!noteResult.success) return
    await saveNoteContent(
      noteResult.data.id,
      'The search system uses LIKE queries with #sqlite'
    )

    // Search for "search" — should match task and note
    const result = await searchAll('search')
    expect(result.success).toBe(true)
    if (!result.success) return

    const tasks = result.data.filter((r) => r.type === 'task')
    const notes = result.data.filter((r) => r.type === 'note')

    expect(tasks.length).toBe(1)
    expect(tasks[0].displayTitle).toBe('Write tests for search')

    expect(notes.length).toBe(1)
    expect(notes[0].displayTitle).toBe('Search Architecture')
  })
})

describe('Search edge cases', () => {
  beforeEach(() => resetTestDb(sqlite))

  test('empty query with no data returns empty results', async () => {
    const result = await searchAll('')
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.length).toBe(0)
  })

  test('whitespace-only query returns recent items', async () => {
    await createTask('A task', 1, TODAY)
    const result = await searchAll('   ')
    expect(result.success).toBe(true)
    if (!result.success) return
    // Trimmed whitespace becomes empty string, which returns recent items
    expect(result.data.length).toBe(1)
  })

  test('search reflects toggled task status', async () => {
    const createResult = await createTask('Toggle test task', 1, TODAY)
    if (!createResult.success) return

    // Toggle to done
    await toggleTask(createResult.data.id)

    const result = await searchAll('Toggle test')
    expect(result.success).toBe(true)
    if (!result.success) return

    const task = result.data[0]
    expect(task.type).toBe('task')
    if (task.type !== 'task') return
    expect(task.status).toBe('done')
  })

  test('deleted note does not appear in search results', async () => {
    const noteResult = await createNote('Deleted Note')
    if (!noteResult.success) return

    await deleteNote(noteResult.data.id)

    const result = await searchAll('Deleted')
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.length).toBe(0)
  })

  test('search result displayTitle is truncated for long text', async () => {
    const longText = 'A'.repeat(200)
    await createTask(longText, 1, TODAY)

    const result = await searchAll('A'.repeat(10))
    expect(result.success).toBe(true)
    if (!result.success) return

    // displayTitle should be truncated to 120 chars with "..."
    expect(result.data[0].displayTitle.length).toBeLessThanOrEqual(120)
    expect(result.data[0].displayTitle.endsWith('...')).toBe(true)
  })

  test('search with partial match finds results', async () => {
    await createTask('Implement authentication', 2, TODAY)

    const result = await searchAll('auth')
    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.data.length).toBe(1)
    expect(result.data[0].displayTitle).toBe('Implement authentication')
  })

  test('recent items are limited to 5 tasks and 5 notes', async () => {
    // Create 7 tasks and 7 notes
    for (let i = 0; i < 7; i++) {
      await createTask(`Task ${i}`, 1, TODAY)
      await createNote(`Note ${i}`)
    }

    const result = await searchAll('')
    expect(result.success).toBe(true)
    if (!result.success) return

    const taskResults = result.data.filter((r) => r.type === 'task')
    const noteResults = result.data.filter((r) => r.type === 'note')
    expect(taskResults.length).toBe(5)
    expect(noteResults.length).toBe(5)
  })

  test('search results include preview snippet for notes', async () => {
    const noteResult = await createNote('Snippet Test')
    if (!noteResult.success) return
    await saveNoteContent(noteResult.data.id, 'This is the preview content for testing.')

    const result = await searchAll('Snippet')
    expect(result.success).toBe(true)
    if (!result.success) return

    const note = result.data[0]
    expect(note.type).toBe('note')
    expect(note.previewSnippet).toBe('This is the preview content for testing.')
  })

  test('search results have correct type discriminators', async () => {
    await createTask('Type check task', 1, TODAY)
    await createNote('Type check note')

    const result = await searchAll('Type check')
    expect(result.success).toBe(true)
    if (!result.success) return

    for (const item of result.data) {
      expect(['task', 'note']).toContain(item.type)
      expect(item.id).toBeTruthy()
      expect(item.displayTitle).toBeTruthy()
      expect(typeof item.updatedAt).toBe('number')
    }
  })
})
