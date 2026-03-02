'use server'

import { db } from '@/lib/db'
import { tasks, notes, events } from '@/db/schema'
import { like, or, desc } from 'drizzle-orm'
import { z } from 'zod'

// --- Zod schemas ---

const searchSchema = z.object({
  query: z.string().min(0).max(200),
})

// --- Types ---

type TaskSearchResult = {
  type: 'task'
  id: string
  displayTitle: string
  previewSnippet: string
  updatedAt: number
  status: string
  priority: number
}

type NoteSearchResult = {
  type: 'note'
  id: string
  displayTitle: string
  previewSnippet: string
  updatedAt: number
  tags: string[]
}

type EventSearchResult = {
  type: 'event'
  id: string
  displayTitle: string
  previewSnippet: string
  updatedAt: number
  startAt: string
  endAt: string
}

export type SearchResult = TaskSearchResult | NoteSearchResult | EventSearchResult

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

// --- Helpers ---

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

function parseTags(tagsJson: string | null): string[] {
  if (!tagsJson) return []
  try {
    const parsed = JSON.parse(tagsJson)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// --- Server Actions ---

export async function searchAll(
  query: string
): Promise<ActionResult<SearchResult[]>> {
  const parsed = searchSchema.safeParse({ query })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const trimmed = parsed.data.query.trim()

  if (trimmed === '') {
    return getRecentItems()
  }

  const pattern = `%${trimmed}%`

  const taskResults = db
    .select()
    .from(tasks)
    .where(like(tasks.text, pattern))
    .orderBy(desc(tasks.updatedAt))
    .limit(10)
    .all()

  const noteResults = db
    .select()
    .from(notes)
    .where(
      or(
        like(notes.title, pattern),
        like(notes.content, pattern),
        like(notes.tags, pattern)
      )
    )
    .orderBy(desc(notes.updatedAt))
    .limit(10)
    .all()

  const eventResults = db
    .select()
    .from(events)
    .where(
      or(
        like(events.title, pattern),
        like(events.description, pattern),
        like(events.location, pattern)
      )
    )
    .orderBy(desc(events.updatedAt))
    .limit(10)
    .all()

  const results: SearchResult[] = [
    ...taskResults.map((task): TaskSearchResult => ({
      type: 'task',
      id: task.id,
      displayTitle: truncate(task.text, 120),
      previewSnippet: truncate(task.text, 120),
      updatedAt: task.updatedAt,
      status: task.status,
      priority: task.priority,
    })),
    ...noteResults.map((note): NoteSearchResult => ({
      type: 'note',
      id: note.id,
      displayTitle: truncate(note.title, 120),
      previewSnippet: truncate(note.content || '', 120),
      updatedAt: note.updatedAt,
      tags: parseTags(note.tags),
    })),
    ...eventResults.map((event): EventSearchResult => ({
      type: 'event',
      id: event.id,
      displayTitle: truncate(event.title, 120),
      previewSnippet: truncate(event.description || event.location || '', 120),
      updatedAt: event.updatedAt,
      startAt: event.startAt,
      endAt: event.endAt,
    })),
  ]

  return { success: true, data: results }
}

async function getRecentItems(): Promise<ActionResult<SearchResult[]>> {
  const recentTasks = db
    .select()
    .from(tasks)
    .orderBy(desc(tasks.updatedAt))
    .limit(5)
    .all()

  const recentNotes = db
    .select()
    .from(notes)
    .orderBy(desc(notes.updatedAt))
    .limit(5)
    .all()

  const recentEvents = db
    .select()
    .from(events)
    .orderBy(desc(events.updatedAt))
    .limit(5)
    .all()

  const results: SearchResult[] = [
    ...recentTasks.map((task): TaskSearchResult => ({
      type: 'task',
      id: task.id,
      displayTitle: truncate(task.text, 120),
      previewSnippet: truncate(task.text, 120),
      updatedAt: task.updatedAt,
      status: task.status,
      priority: task.priority,
    })),
    ...recentNotes.map((note): NoteSearchResult => ({
      type: 'note',
      id: note.id,
      displayTitle: truncate(note.title, 120),
      previewSnippet: truncate(note.content || '', 120),
      updatedAt: note.updatedAt,
      tags: parseTags(note.tags),
    })),
    ...recentEvents.map((event): EventSearchResult => ({
      type: 'event',
      id: event.id,
      displayTitle: truncate(event.title, 120),
      previewSnippet: truncate(event.description || event.location || '', 120),
      updatedAt: event.updatedAt,
      startAt: event.startAt,
      endAt: event.endAt,
    })),
  ]

  return { success: true, data: results }
}
