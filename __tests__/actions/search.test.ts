import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { createTestDb, resetTestDb } from '../helpers/test-db'
import { tasks, notes } from '@/db/schema'

// --- Set up in-memory DB and mocks before imports ---

const { db: testDb, sqlite } = createTestDb()

mock.module('@/lib/db', () => ({ db: testDb }))
mock.module('next/cache', () => ({ revalidatePath: mock(() => {}) }))

const { searchAll } = await import('@/lib/actions/search')

// --- Helpers ---

function insertTask(text: string, priority = 1, date = '2025-06-15') {
  const now = Date.now()
  const id = crypto.randomUUID()
  testDb.insert(tasks).values({
    id,
    text,
    status: 'todo',
    priority,
    date,
    createdAt: now,
    updatedAt: now,
  }).run()
  return id
}

function insertNote(title: string, content = '', tagList: string[] = []) {
  const now = Date.now()
  const id = crypto.randomUUID()
  testDb.insert(notes).values({
    id,
    title,
    content,
    tags: JSON.stringify(tagList),
    createdAt: now,
    updatedAt: now,
  }).run()
  return id
}

// --- Tests ---

describe('searchAll', () => {
  beforeEach(() => resetTestDb(sqlite))

  test('returns matching tasks by text', async () => {
    insertTask('Buy groceries')
    insertTask('Walk the dog')

    const result = await searchAll('groceries')
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data).toHaveLength(1)
    expect(result.data[0].type).toBe('task')
    expect(result.data[0].displayTitle).toContain('groceries')
  })

  test('returns matching notes by title', async () => {
    insertNote('Meeting Notes', 'some content')
    insertNote('Shopping List', 'items')

    const result = await searchAll('Meeting')
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data).toHaveLength(1)
    expect(result.data[0].type).toBe('note')
    expect(result.data[0].displayTitle).toContain('Meeting')
  })

  test('returns matching notes by content', async () => {
    insertNote('Note 1', 'React hooks tutorial')
    insertNote('Note 2', 'CSS grid guide')

    const result = await searchAll('hooks')
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data).toHaveLength(1)
    expect(result.data[0].type).toBe('note')
  })

  test('returns matching notes by tags', async () => {
    insertNote('Note 1', 'content', ['react', 'typescript'])
    insertNote('Note 2', 'content', ['python'])

    const result = await searchAll('typescript')
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data).toHaveLength(1)
    expect(result.data[0].type).toBe('note')
  })

  test('returns both tasks and notes matching the query', async () => {
    insertTask('Review project plan')
    insertNote('Project Plan', 'detailed plan')

    const result = await searchAll('project')
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.length).toBeGreaterThanOrEqual(2)
    const types = result.data.map((r) => r.type)
    expect(types).toContain('task')
    expect(types).toContain('note')
  })

  test('returns recent items when query is empty', async () => {
    insertTask('Recent task')
    insertNote('Recent note', 'content')

    const result = await searchAll('')
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.length).toBeGreaterThanOrEqual(2)
  })

  test('returns recent items when query is whitespace only', async () => {
    insertTask('A task')
    insertNote('A note')

    const result = await searchAll('   ')
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.length).toBeGreaterThanOrEqual(2)
  })

  test('returns empty results when nothing matches', async () => {
    insertTask('Task A')
    insertNote('Note B')

    const result = await searchAll('zzzzzzzzz')
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data).toHaveLength(0)
  })

  test('search is case-insensitive (SQLite LIKE)', async () => {
    insertTask('Buy GROCERIES')

    const result = await searchAll('groceries')
    expect(result.success).toBe(true)
    if (!result.success) return
    // SQLite LIKE is case-insensitive for ASCII by default
    expect(result.data).toHaveLength(1)
  })

  test('limits results to 10 tasks and 10 notes max', async () => {
    for (let i = 0; i < 15; i++) {
      insertTask(`Task matching ${i}`)
    }
    for (let i = 0; i < 15; i++) {
      insertNote(`Note matching ${i}`, `matching content ${i}`)
    }

    const result = await searchAll('matching')
    expect(result.success).toBe(true)
    if (!result.success) return
    const taskResults = result.data.filter((r) => r.type === 'task')
    const noteResults = result.data.filter((r) => r.type === 'note')
    expect(taskResults.length).toBeLessThanOrEqual(10)
    expect(noteResults.length).toBeLessThanOrEqual(10)
  })

  test('truncates long display titles', async () => {
    const longText = 'x'.repeat(200)
    insertTask(longText)

    const result = await searchAll('xxx')
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data[0].displayTitle.length).toBeLessThanOrEqual(120)
  })

  test('task results include status and priority', async () => {
    insertTask('High priority task', 3)

    const result = await searchAll('priority')
    expect(result.success).toBe(true)
    if (!result.success) return
    const taskResult = result.data.find((r) => r.type === 'task')
    expect(taskResult).toBeDefined()
    if (taskResult?.type === 'task') {
      expect(taskResult.status).toBe('todo')
      expect(taskResult.priority).toBe(3)
    }
  })

  test('note results include parsed tags array', async () => {
    insertNote('Tagged note', 'content', ['react', 'typescript'])

    const result = await searchAll('Tagged')
    expect(result.success).toBe(true)
    if (!result.success) return
    const noteResult = result.data.find((r) => r.type === 'note')
    expect(noteResult).toBeDefined()
    if (noteResult?.type === 'note') {
      expect(noteResult.tags).toEqual(['react', 'typescript'])
    }
  })

  test('handles notes with null/invalid tags JSON gracefully', async () => {
    const now = Date.now()
    const id = crypto.randomUUID()
    // Insert note with invalid tags JSON directly
    sqlite.run(
      `INSERT INTO notes (id, title, content, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, 'Bad tags note', 'content', 'not-valid-json', now, now]
    )

    const result = await searchAll('Bad tags')
    expect(result.success).toBe(true)
    if (!result.success) return
    const noteResult = result.data.find((r) => r.type === 'note')
    expect(noteResult).toBeDefined()
    if (noteResult?.type === 'note') {
      expect(noteResult.tags).toEqual([])
    }
  })

  test('recent items limited to 5 tasks and 5 notes', async () => {
    for (let i = 0; i < 8; i++) {
      insertTask(`Task ${i}`)
    }
    for (let i = 0; i < 8; i++) {
      insertNote(`Note ${i}`)
    }

    const result = await searchAll('')
    expect(result.success).toBe(true)
    if (!result.success) return
    const taskResults = result.data.filter((r) => r.type === 'task')
    const noteResults = result.data.filter((r) => r.type === 'note')
    expect(taskResults.length).toBeLessThanOrEqual(5)
    expect(noteResults.length).toBeLessThanOrEqual(5)
  })
})
