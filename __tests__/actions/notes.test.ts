import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { createTestDb, resetTestDb } from '../helpers/test-db'

// --- Set up in-memory DB and mocks before imports ---

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

const { extractTags } = await import('@/lib/utils')

// --- Tests ---

describe('createNote', () => {
  beforeEach(() => resetTestDb(sqlite))

  test('creates a note with valid title', async () => {
    const result = await createNote('My First Note')
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.title).toBe('My First Note')
    expect(result.data.content).toBe('')
    expect(result.data.tags).toBe('[]')
    expect(result.data.id).toBeTruthy()
    expect(result.data.createdAt).toBeGreaterThan(0)
    expect(result.data.updatedAt).toBeGreaterThan(0)
  })

  test('rejects empty title', async () => {
    const result = await createNote('')
    expect(result.success).toBe(false)
  })

  test('rejects whitespace-only title', async () => {
    const result = await createNote('   ')
    expect(result.success).toBe(false)
  })

  test('rejects title exceeding 200 characters', async () => {
    const longTitle = 'a'.repeat(201)
    const result = await createNote(longTitle)
    expect(result.success).toBe(false)
  })

  test('accepts title at exactly 200 characters', async () => {
    const maxTitle = 'a'.repeat(200)
    const result = await createNote(maxTitle)
    expect(result.success).toBe(true)
  })

  test('generates unique IDs', async () => {
    const r1 = await createNote('Note 1')
    const r2 = await createNote('Note 2')
    expect(r1.success && r2.success).toBe(true)
    if (!r1.success || !r2.success) return
    expect(r1.data.id).not.toBe(r2.data.id)
  })
})

describe('updateNote', () => {
  beforeEach(() => resetTestDb(sqlite))

  test('updates title', async () => {
    const created = await createNote('Original Title')
    if (!created.success) throw new Error('Setup failed')

    const result = await updateNote(created.data.id, { title: 'Updated Title' })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.title).toBe('Updated Title')
  })

  test('updates content', async () => {
    const created = await createNote('Note')
    if (!created.success) throw new Error('Setup failed')

    const result = await updateNote(created.data.id, { content: 'New content here' })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.content).toBe('New content here')
  })

  test('updates tags', async () => {
    const created = await createNote('Note')
    if (!created.success) throw new Error('Setup failed')

    const result = await updateNote(created.data.id, { tags: ['work', 'important'] })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(JSON.parse(result.data.tags as string)).toEqual(['work', 'important'])
  })

  test('updates multiple fields at once', async () => {
    const created = await createNote('Note')
    if (!created.success) throw new Error('Setup failed')

    const result = await updateNote(created.data.id, {
      title: 'New Title',
      content: 'New Content',
      tags: ['tag1'],
    })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.title).toBe('New Title')
    expect(result.data.content).toBe('New Content')
    expect(JSON.parse(result.data.tags as string)).toEqual(['tag1'])
  })

  test('returns error for non-existent note', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000'
    const result = await updateNote(fakeId, { title: 'Nope' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Note not found')
    }
  })

  test('returns error for invalid (non-UUID) ID', async () => {
    const result = await updateNote('bad-id', { title: 'Nope' })
    expect(result.success).toBe(false)
  })

  test('rejects empty title in update', async () => {
    const created = await createNote('Note')
    if (!created.success) throw new Error('Setup failed')

    const result = await updateNote(created.data.id, { title: '' })
    expect(result.success).toBe(false)
  })

  test('updates updatedAt timestamp', async () => {
    const created = await createNote('Note')
    if (!created.success) throw new Error('Setup failed')

    const originalUpdatedAt = created.data.updatedAt
    await new Promise((r) => setTimeout(r, 5))
    const result = await updateNote(created.data.id, { title: 'Changed' })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt)
  })
})

describe('deleteNote', () => {
  beforeEach(() => resetTestDb(sqlite))

  test('deletes an existing note', async () => {
    const created = await createNote('Delete me')
    if (!created.success) throw new Error('Setup failed')

    const result = await deleteNote(created.data.id)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.id).toBe(created.data.id)

    // Verify note is gone
    const fetched = await getNoteById(created.data.id)
    expect(fetched).toBeUndefined()
  })

  test('returns error for non-existent note', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000'
    const result = await deleteNote(fakeId)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Note not found')
    }
  })

  test('returns error for invalid (non-UUID) ID', async () => {
    const result = await deleteNote('bad-id')
    expect(result.success).toBe(false)
  })

  test('does not affect other notes', async () => {
    const n1 = await createNote('Keep me')
    const n2 = await createNote('Delete me')
    if (!n1.success || !n2.success) throw new Error('Setup failed')

    await deleteNote(n2.data.id)
    const notes = await getNotes()
    expect(notes).toHaveLength(1)
    expect(notes[0].id).toBe(n1.data.id)
  })
})

describe('getNotes', () => {
  beforeEach(() => resetTestDb(sqlite))

  test('returns all notes ordered by updatedAt desc', async () => {
    await createNote('First note')
    await new Promise((r) => setTimeout(r, 5))
    await createNote('Second note')

    const notes = await getNotes()
    expect(notes).toHaveLength(2)
    // Most recently updated first
    expect(notes[0].title).toBe('Second note')
    expect(notes[1].title).toBe('First note')
  })

  test('returns empty array when no notes exist', async () => {
    const notes = await getNotes()
    expect(notes).toHaveLength(0)
  })
})

describe('getNoteById', () => {
  beforeEach(() => resetTestDb(sqlite))

  test('returns note by valid ID', async () => {
    const created = await createNote('Find me')
    if (!created.success) throw new Error('Setup failed')

    const note = await getNoteById(created.data.id)
    expect(note).toBeDefined()
    expect(note?.title).toBe('Find me')
  })

  test('returns undefined for non-existent ID', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000'
    const note = await getNoteById(fakeId)
    expect(note).toBeUndefined()
  })

  test('returns undefined for invalid (non-UUID) ID', async () => {
    const note = await getNoteById('bad-id')
    expect(note).toBeUndefined()
  })
})

describe('saveNoteContent', () => {
  beforeEach(() => resetTestDb(sqlite))

  test('saves content and returns updated note', async () => {
    const created = await createNote('Note')
    if (!created.success) throw new Error('Setup failed')

    const result = await saveNoteContent(created.data.id, 'Updated content')
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.content).toBe('Updated content')
  })

  test('extracts tags from content automatically', async () => {
    const created = await createNote('Note')
    if (!created.success) throw new Error('Setup failed')

    const result = await saveNoteContent(created.data.id, 'Working on #react and #typescript')
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(JSON.parse(result.data.tags as string)).toEqual(['react', 'typescript'])
  })

  test('deduplicates extracted tags', async () => {
    const created = await createNote('Note')
    if (!created.success) throw new Error('Setup failed')

    const result = await saveNoteContent(created.data.id, '#work and more #work stuff')
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(JSON.parse(result.data.tags as string)).toEqual(['work'])
  })

  test('handles content with no tags', async () => {
    const created = await createNote('Note')
    if (!created.success) throw new Error('Setup failed')

    const result = await saveNoteContent(created.data.id, 'No tags here')
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.tags).toBe('[]')
  })

  test('handles empty content', async () => {
    const created = await createNote('Note')
    if (!created.success) throw new Error('Setup failed')

    const result = await saveNoteContent(created.data.id, '')
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.content).toBe('')
    expect(result.data.tags).toBe('[]')
  })

  test('handles tags with hyphens and underscores', async () => {
    const created = await createNote('Note')
    if (!created.success) throw new Error('Setup failed')

    const result = await saveNoteContent(created.data.id, '#my-project #some_task')
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(JSON.parse(result.data.tags as string)).toEqual(['my-project', 'some_task'])
  })

  test('returns error for non-existent note', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000'
    const result = await saveNoteContent(fakeId, 'content')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Note not found')
    }
  })

  test('returns error for invalid (non-UUID) ID', async () => {
    const result = await saveNoteContent('bad-id', 'content')
    expect(result.success).toBe(false)
  })

  test('updates updatedAt timestamp', async () => {
    const created = await createNote('Note')
    if (!created.success) throw new Error('Setup failed')

    const originalUpdatedAt = created.data.updatedAt
    await new Promise((r) => setTimeout(r, 5))
    const result = await saveNoteContent(created.data.id, 'new stuff')
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt)
  })

  test('content is persisted and retrievable', async () => {
    const created = await createNote('Note')
    if (!created.success) throw new Error('Setup failed')

    await saveNoteContent(created.data.id, 'Persisted content #test')
    const fetched = await getNoteById(created.data.id)
    expect(fetched?.content).toBe('Persisted content #test')
    expect(JSON.parse(fetched?.tags as string)).toEqual(['test'])
  })

  test('special characters in content do not break tag extraction', async () => {
    const created = await createNote('Note')
    if (!created.success) throw new Error('Setup failed')

    const result = await saveNoteContent(
      created.data.id,
      'Content with <html> & "quotes" #valid-tag! $pecial chars #another_tag...'
    )
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(JSON.parse(result.data.tags as string)).toEqual(['valid-tag', 'another_tag'])
  })

  test('empty content clears existing tags', async () => {
    const created = await createNote('Note')
    if (!created.success) throw new Error('Setup failed')

    // First save with tags
    await saveNoteContent(created.data.id, 'Has #some #tags')
    const withTags = await getNoteById(created.data.id)
    expect(JSON.parse(withTags?.tags as string)).toEqual(['some', 'tags'])

    // Then save empty content
    const result = await saveNoteContent(created.data.id, '')
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.tags).toBe('[]')
    expect(result.data.content).toBe('')
  })
})

describe('extractTags (utility)', () => {
  test('extracts a single tag', () => {
    expect(extractTags('Hello #world')).toEqual(['world'])
  })

  test('extracts multiple tags', () => {
    expect(extractTags('#foo bar #baz')).toEqual(['foo', 'baz'])
  })

  test('deduplicates tags', () => {
    expect(extractTags('#foo #foo #bar')).toEqual(['foo', 'bar'])
  })

  test('returns empty array when no tags', () => {
    expect(extractTags('no tags here')).toEqual([])
  })

  test('handles hyphens and underscores', () => {
    expect(extractTags('#my-tag #my_tag')).toEqual(['my-tag', 'my_tag'])
  })

  test('returns empty array for empty string', () => {
    expect(extractTags('')).toEqual([])
  })

  test('ignores bare hash', () => {
    expect(extractTags('# alone')).toEqual([])
  })

  test('handles ## prefix attached to word', () => {
    expect(extractTags('##heading')).toEqual(['heading'])
  })

  test('ignores markdown heading syntax with space', () => {
    expect(extractTags('## My Heading')).toEqual([])
  })

  test('ignores markdown heading lines but extracts inline tags', () => {
    const text = '## Section Title\nSome text with #inline-tag here'
    const tags = extractTags(text)
    expect(tags).toContain('inline-tag')
  })

  test('extracts tags at various positions in text', () => {
    const text = '#start middle #middle end #end'
    expect(extractTags(text)).toEqual(['start', 'middle', 'end'])
  })

  test('extracts tags from multiline content', () => {
    const text = 'Line one #first\nLine two #second\nLine three #third'
    expect(extractTags(text)).toEqual(['first', 'second', 'third'])
  })

  test('case-sensitive tags are kept distinct', () => {
    // The regex extracts as-is, so case matters for uniqueness
    expect(extractTags('#React #react')).toEqual(['React', 'react'])
  })

  test('handles tag with numbers', () => {
    expect(extractTags('Using #es2024 features')).toEqual(['es2024'])
  })
})
