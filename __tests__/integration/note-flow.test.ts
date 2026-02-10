/**
 * Integration test: Note creation and editing flow
 *
 * Tests the complete note lifecycle end-to-end through server actions:
 * create → list → edit title → edit content → verify tag extraction → delete
 * Also covers validation, error handling, and edge cases.
 */
import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { createTestDb, resetTestDb } from '../helpers/test-db'
import type { Database } from 'bun:sqlite'

const { db: testDb, sqlite } = createTestDb()

mock.module('@/lib/db', () => ({ db: testDb }))
mock.module('next/cache', () => ({ revalidatePath: mock(() => {}) }))

const {
  createNote,
  updateNote,
  deleteNote,
  getNotes,
  getNoteById,
  saveNoteContent,
} = await import('@/lib/actions/notes')

describe('Note creation and editing flow (end-to-end)', () => {
  beforeEach(() => resetTestDb(sqlite))

  test('create a note and see it in the notes list', async () => {
    const result = await createNote('My First Note')
    expect(result.success).toBe(true)
    if (!result.success) return

    const notes = await getNotes()
    expect(notes.length).toBe(1)
    expect(notes[0].title).toBe('My First Note')
    expect(notes[0].content).toBe('')
    expect(notes[0].tags).toBe('[]')
  })

  test('create a note and edit its title', async () => {
    const createResult = await createNote('Draft Title')
    if (!createResult.success) return
    const noteId = createResult.data.id

    const updateResult = await updateNote(noteId, { title: 'Final Title' })
    expect(updateResult.success).toBe(true)

    const note = await getNoteById(noteId)
    expect(note?.title).toBe('Final Title')
  })

  test('create a note, add content, verify content saved', async () => {
    const createResult = await createNote('Content Test')
    if (!createResult.success) return
    const noteId = createResult.data.id

    await saveNoteContent(noteId, '# Hello World\n\nSome paragraph text.')

    const note = await getNoteById(noteId)
    expect(note?.content).toBe('# Hello World\n\nSome paragraph text.')
  })

  test('content with hashtags triggers automatic tag extraction', async () => {
    const createResult = await createNote('Tagged Note')
    if (!createResult.success) return
    const noteId = createResult.data.id

    await saveNoteContent(
      noteId,
      'Working on #react and #typescript today.\nAlso some #react patterns.'
    )

    const note = await getNoteById(noteId)
    const tags = JSON.parse(note?.tags || '[]')
    expect(tags).toContain('react')
    expect(tags).toContain('typescript')
    // Duplicates should be removed
    expect(tags.filter((t: string) => t === 'react').length).toBe(1)
  })

  test('editing content updates tags automatically', async () => {
    const createResult = await createNote('Evolving Tags')
    if (!createResult.success) return
    const noteId = createResult.data.id

    // First save with tags
    await saveNoteContent(noteId, 'Using #react and #nextjs')
    let note = await getNoteById(noteId)
    let tags = JSON.parse(note?.tags || '[]')
    expect(tags).toContain('react')
    expect(tags).toContain('nextjs')

    // Second save with different tags
    await saveNoteContent(noteId, 'Switched to #vue and #nuxt')
    note = await getNoteById(noteId)
    tags = JSON.parse(note?.tags || '[]')
    expect(tags).toContain('vue')
    expect(tags).toContain('nuxt')
    expect(tags).not.toContain('react')
    expect(tags).not.toContain('nextjs')
  })

  test('create a note, then delete it', async () => {
    const createResult = await createNote('Temporary Note')
    if (!createResult.success) return
    const noteId = createResult.data.id

    const deleteResult = await deleteNote(noteId)
    expect(deleteResult.success).toBe(true)

    const note = await getNoteById(noteId)
    expect(note).toBeUndefined()

    const notes = await getNotes()
    expect(notes.find((n) => n.id === noteId)).toBeUndefined()
  })

  test('notes are ordered by updatedAt descending', async () => {
    const r1 = await createNote('Older Note')
    if (!r1.success) return
    // Ensure a small time gap
    await new Promise((r) => setTimeout(r, 10))
    const r2 = await createNote('Newer Note')
    if (!r2.success) return

    const notes = await getNotes()
    expect(notes.length).toBe(2)
    expect(notes[0].title).toBe('Newer Note')
    expect(notes[1].title).toBe('Older Note')
  })

  test('update multiple fields at once', async () => {
    const createResult = await createNote('Multi-update')
    if (!createResult.success) return
    const noteId = createResult.data.id

    await updateNote(noteId, {
      title: 'Updated Title',
      content: 'Updated content',
      tags: ['updated'],
    })

    const note = await getNoteById(noteId)
    expect(note?.title).toBe('Updated Title')
    expect(note?.content).toBe('Updated content')
    expect(note?.tags).toBe('["updated"]')
  })

  test('full lifecycle: create, edit title, add content, verify tags, delete', async () => {
    // Create
    const createResult = await createNote('Draft')
    if (!createResult.success) return
    const id = createResult.data.id

    // Edit title
    await updateNote(id, { title: 'Project Ideas' })

    // Add content with tags
    await saveNoteContent(id, '# Ideas\n\n- Use #typescript for type safety\n- Try #drizzle ORM')

    // Verify
    const note = await getNoteById(id)
    expect(note?.title).toBe('Project Ideas')
    expect(note?.content).toContain('# Ideas')
    const tags = JSON.parse(note?.tags || '[]')
    expect(tags).toContain('typescript')
    expect(tags).toContain('drizzle')

    // Delete
    await deleteNote(id)
    expect(await getNoteById(id)).toBeUndefined()
  })
})

describe('Note validation and error handling', () => {
  beforeEach(() => resetTestDb(sqlite))

  test('creating a note with empty title fails validation', async () => {
    const result = await createNote('')
    expect(result.success).toBe(false)
  })

  test('creating a note with whitespace-only title fails validation', async () => {
    const result = await createNote('   ')
    expect(result.success).toBe(false)
  })

  test('updating a non-existent note returns error', async () => {
    const result = await updateNote(crypto.randomUUID(), { title: 'New' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Note not found')
    }
  })

  test('deleting a non-existent note returns error', async () => {
    const result = await deleteNote(crypto.randomUUID())
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Note not found')
    }
  })

  test('saving content to a non-existent note returns error', async () => {
    const result = await saveNoteContent(crypto.randomUUID(), 'some content')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Note not found')
    }
  })

  test('getNoteById returns undefined for non-existent ID', async () => {
    const note = await getNoteById(crypto.randomUUID())
    expect(note).toBeUndefined()
  })

  test('getNotes returns empty array when no notes exist', async () => {
    const notes = await getNotes()
    expect(notes).toEqual([])
  })

  test('created note has valid timestamps', async () => {
    const before = Date.now()
    const result = await createNote('Timestamp check')
    const after = Date.now()

    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.data.createdAt).toBeGreaterThanOrEqual(before)
    expect(result.data.createdAt).toBeLessThanOrEqual(after)
    expect(result.data.updatedAt).toBeGreaterThanOrEqual(before)
    expect(result.data.updatedAt).toBeLessThanOrEqual(after)
  })

  test('saving content updates updatedAt timestamp', async () => {
    const createResult = await createNote('Timestamp update')
    if (!createResult.success) return
    const originalUpdatedAt = createResult.data.updatedAt

    await new Promise((r) => setTimeout(r, 10))

    await saveNoteContent(createResult.data.id, 'New content')
    const note = await getNoteById(createResult.data.id)
    expect(note!.updatedAt).toBeGreaterThan(originalUpdatedAt)
  })

  test('content without hashtags results in empty tags', async () => {
    const createResult = await createNote('No Tags Note')
    if (!createResult.success) return

    await saveNoteContent(createResult.data.id, 'Plain content with no tags at all.')

    const note = await getNoteById(createResult.data.id)
    const tags = JSON.parse(note?.tags || '[]')
    expect(tags).toEqual([])
  })

  test('each created note gets a unique ID', async () => {
    const r1 = await createNote('Note 1')
    const r2 = await createNote('Note 2')
    const r3 = await createNote('Note 3')

    if (!r1.success || !r2.success || !r3.success) return
    const ids = new Set([r1.data.id, r2.data.id, r3.data.id])
    expect(ids.size).toBe(3)
  })
})
