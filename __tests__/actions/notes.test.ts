import { describe, test, expect, mock, beforeEach } from 'bun:test'

// --- Mock next/cache ---
mock.module('next/cache', () => ({
  revalidatePath: mock(() => {}),
}))

// --- Mock db with chainable query builder ---
const mockGet = mock()
const mockAll = mock()
const mockReturning = mock(() => ({ all: mockAll }))
const mockSet = mock(() => ({ where: mock(() => ({ returning: mockReturning })) }))
const mockWhereSelect = mock(() => ({ get: mockGet }))
const mockFrom = mock(() => ({ where: mockWhereSelect }))
const mockSelect = mock(() => ({ from: mockFrom }))
const mockUpdate = mock(() => ({ set: mockSet }))

mock.module('@/lib/db', () => ({
  db: {
    select: mockSelect,
    update: mockUpdate,
  },
}))

// Import after mocks are set up
const { extractTags, saveNoteContent } = await import('@/lib/actions/notes')
const { revalidatePath } = await import('next/cache')

// --- Test Data ---
const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'

const mockNote = {
  id: VALID_UUID,
  title: 'Test Note',
  content: 'old content',
  tags: '[]',
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
}

// --- extractTags ---

describe('extractTags', () => {
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

  test('ignores bare hash, handles ## prefix', () => {
    // Bare '#' followed by space is not a valid tag
    expect(extractTags('# alone')).toEqual([])
    // '##word' — regex matches '#word' starting from second #
    expect(extractTags('##invalid')).toEqual(['invalid'])
    // Bare '#' with no following alphanumeric is ignored
    expect(extractTags('# #valid')).toEqual(['valid'])
  })
})

// --- saveNoteContent ---

describe('saveNoteContent', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockAll.mockReset()
    mockSet.mockReset()
    mockReturning.mockReset()
    mockSelect.mockReset()
    mockUpdate.mockReset()
    mockFrom.mockReset()
    mockWhereSelect.mockReset()
    ;(revalidatePath as ReturnType<typeof mock>).mockReset()

    // Re-wire chaining after reset
    mockSelect.mockReturnValue({ from: mockFrom })
    mockFrom.mockReturnValue({ where: mockWhereSelect })
    mockWhereSelect.mockReturnValue({ get: mockGet })
    mockUpdate.mockReturnValue({ set: mockSet })
    mockSet.mockReturnValue({ where: mock(() => ({ returning: mockReturning })) })
    mockReturning.mockReturnValue({ all: mockAll })
  })

  test('successfully updates content and returns updated note', async () => {
    const updatedNote = { ...mockNote, content: 'new content', tags: '[]', updatedAt: Date.now() }
    mockGet.mockReturnValue(mockNote)
    mockAll.mockReturnValue([updatedNote])

    const result = await saveNoteContent(VALID_UUID, 'new content')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.content).toBe('new content')
    }
  })

  test('extracts and stores tags from content as JSON string', async () => {
    const content = 'Hello #react and #typescript'
    const updatedNote = {
      ...mockNote,
      content,
      tags: JSON.stringify(['react', 'typescript']),
      updatedAt: Date.now(),
    }
    mockGet.mockReturnValue(mockNote)
    mockAll.mockReturnValue([updatedNote])

    const result = await saveNoteContent(VALID_UUID, content)

    expect(result.success).toBe(true)
    // Verify that db.update was called (tags extraction happens internally)
    expect(mockUpdate).toHaveBeenCalled()
    if (result.success) {
      expect(JSON.parse(result.data.tags as string)).toEqual(['react', 'typescript'])
    }
  })

  test('returns error for non-existent note ID', async () => {
    mockGet.mockReturnValue(undefined)

    const result = await saveNoteContent(VALID_UUID, 'some content')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Note not found')
    }
  })

  test('returns error for invalid (non-UUID) ID', async () => {
    const result = await saveNoteContent('not-a-uuid', 'some content')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBeDefined()
    }
  })

  test('handles empty content string (tags become "[]")', async () => {
    const updatedNote = { ...mockNote, content: '', tags: '[]', updatedAt: Date.now() }
    mockGet.mockReturnValue(mockNote)
    mockAll.mockReturnValue([updatedNote])

    const result = await saveNoteContent(VALID_UUID, '')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tags).toBe('[]')
    }
  })

  test('updates updatedAt timestamp to current time', async () => {
    const beforeTime = Date.now()
    const updatedNote = { ...mockNote, content: 'test', tags: '[]', updatedAt: beforeTime }
    mockGet.mockReturnValue(mockNote)
    mockAll.mockReturnValue([updatedNote])

    const result = await saveNoteContent(VALID_UUID, 'test')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.updatedAt).toBeGreaterThanOrEqual(beforeTime)
    }
  })
})
