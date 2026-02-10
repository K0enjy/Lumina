import { describe, test, expect } from 'bun:test'
import { extractTags } from '@/lib/utils'

// --- Types ---

type NoteData = {
  id: string
  title: string
  content: string | null
  tags: string | null
  createdAt: number
  updatedAt: number
}

// --- Pure logic functions (mirroring NotesPageClient logic) ---

function extractUniqueTags(notes: NoteData[]): string[] {
  const tagSet = new Set<string>()
  for (const note of notes) {
    const parsed: string[] = note.tags ? JSON.parse(note.tags) : []
    for (const tag of parsed) {
      tagSet.add(tag)
    }
  }
  return Array.from(tagSet).sort()
}

function filterNotesByTags(notes: NoteData[], selectedTags: string[]): NoteData[] {
  if (selectedTags.length === 0) return notes
  return notes.filter((note) => {
    const parsed: string[] = note.tags ? JSON.parse(note.tags) : []
    return selectedTags.every((tag) => parsed.includes(tag))
  })
}

// --- Mock Data ---

function makeNote(id: string, title: string, tags: string[]): NoteData {
  return {
    id,
    title,
    content: `Content for ${title}`,
    tags: JSON.stringify(tags),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

const noteWork = makeNote('1', 'Work meeting notes', ['work', 'meeting'])
const noteIdeas = makeNote('2', 'Project ideas', ['ideas', 'work'])
const notePersonal = makeNote('3', 'Personal journal', ['personal'])
const noteNoTags = makeNote('4', 'Quick thought', [])
const noteManyTags = makeNote('5', 'Research doc', ['work', 'ideas', 'research', 'important'])
const noteOverlap = makeNote('6', 'Meeting ideas', ['meeting', 'ideas'])

const allNotes: NoteData[] = [noteWork, noteIdeas, notePersonal, noteNoTags, noteManyTags, noteOverlap]

// --- Tests ---

describe('extractUniqueTags', () => {
  test('extracts unique tags from multiple notes', () => {
    const tags = extractUniqueTags(allNotes)
    expect(tags).toEqual(['ideas', 'important', 'meeting', 'personal', 'research', 'work'])
  })

  test('returns sorted array', () => {
    const tags = extractUniqueTags(allNotes)
    const sorted = [...tags].sort()
    expect(tags).toEqual(sorted)
  })

  test('deduplicates tags that appear in multiple notes', () => {
    const tags = extractUniqueTags([noteWork, noteIdeas])
    // 'work' appears in both notes but should only appear once
    expect(tags.filter((t) => t === 'work')).toHaveLength(1)
    expect(tags).toEqual(['ideas', 'meeting', 'work'])
  })

  test('returns empty array when all notes have no tags', () => {
    const tags = extractUniqueTags([noteNoTags])
    expect(tags).toEqual([])
  })

  test('returns empty array for empty notes list', () => {
    const tags = extractUniqueTags([])
    expect(tags).toEqual([])
  })

  test('handles notes with null tags field', () => {
    const noteNullTags: NoteData = {
      id: '99',
      title: 'Null tags',
      content: null,
      tags: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    const tags = extractUniqueTags([noteNullTags])
    expect(tags).toEqual([])
  })

  test('handles mix of tagged and untagged notes', () => {
    const tags = extractUniqueTags([noteNoTags, notePersonal, noteNoTags])
    expect(tags).toEqual(['personal'])
  })
})

describe('filterNotesByTags (AND logic)', () => {
  test('returns all notes when no tags selected', () => {
    const result = filterNotesByTags(allNotes, [])
    expect(result).toEqual(allNotes)
  })

  test('filters by single tag', () => {
    const result = filterNotesByTags(allNotes, ['work'])
    expect(result).toHaveLength(3)
    expect(result.map((n) => n.id)).toEqual(['1', '2', '5'])
  })

  test('AND logic: multiple tags returns only notes with ALL selected tags', () => {
    const result = filterNotesByTags(allNotes, ['work', 'ideas'])
    // Only noteIdeas (#2) and noteManyTags (#5) have both 'work' AND 'ideas'
    expect(result).toHaveLength(2)
    expect(result.map((n) => n.id)).toEqual(['2', '5'])
  })

  test('AND logic: three tags narrows results further', () => {
    const result = filterNotesByTags(allNotes, ['work', 'ideas', 'research'])
    // Only noteManyTags (#5) has all three
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('5')
  })

  test('returns empty when no notes match all selected tags', () => {
    const result = filterNotesByTags(allNotes, ['work', 'personal'])
    expect(result).toHaveLength(0)
  })

  test('excludes notes with no tags when filtering', () => {
    const result = filterNotesByTags(allNotes, ['work'])
    const ids = result.map((n) => n.id)
    expect(ids).not.toContain('4') // noteNoTags
  })

  test('handles notes with null tags during filtering', () => {
    const notesWithNull: NoteData[] = [
      { id: '10', title: 'Null', content: null, tags: null, createdAt: 0, updatedAt: 0 },
      noteWork,
    ]
    const result = filterNotesByTags(notesWithNull, ['work'])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })
})

describe('clear selection resets to all notes', () => {
  test('selecting tags then clearing returns full list', () => {
    // Simulate: first filter, then clear (empty selectedTags)
    const filtered = filterNotesByTags(allNotes, ['personal'])
    expect(filtered).toHaveLength(1)

    const cleared = filterNotesByTags(allNotes, [])
    expect(cleared).toEqual(allNotes)
    expect(cleared).toHaveLength(6)
  })
})

describe('TagFilter empty state', () => {
  test('empty tags array means no filter UI should render', () => {
    // The TagFilter component returns null when tags.length === 0
    // We verify the condition that drives this behavior
    const tags = extractUniqueTags([noteNoTags])
    expect(tags).toHaveLength(0)
    // With zero tags, TagFilter returns null (no UI rendered)
  })

  test('notes with tags produce non-empty tag list', () => {
    const tags = extractUniqueTags([noteWork, noteIdeas])
    expect(tags.length).toBeGreaterThan(0)
    // With tags present, TagFilter renders buttons
  })
})

describe('extractTags utility', () => {
  test('extracts hashtags from content', () => {
    const tags = extractTags('Working on #project and #ideas')
    expect(tags).toEqual(['project', 'ideas'])
  })

  test('returns empty array for empty content', () => {
    expect(extractTags('')).toEqual([])
  })

  test('returns empty array for content without hashtags', () => {
    expect(extractTags('No tags here')).toEqual([])
  })

  test('deduplicates tags in content', () => {
    const tags = extractTags('#work and more #work stuff')
    expect(tags).toEqual(['work'])
  })

  test('handles tags with hyphens and underscores', () => {
    const tags = extractTags('#my-project #some_task')
    expect(tags).toEqual(['my-project', 'some_task'])
  })

  test('handles multiple tags together', () => {
    const tags = extractTags('#a #b #c #d')
    expect(tags).toEqual(['a', 'b', 'c', 'd'])
  })

  test('returns empty array for null/undefined content', () => {
    expect(extractTags(null as unknown as string)).toEqual([])
    expect(extractTags(undefined as unknown as string)).toEqual([])
  })
})
