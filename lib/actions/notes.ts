'use server'

import { db } from '@/lib/db'
import { notes } from '@/db/schema'
import { revalidatePath } from 'next/cache'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'
import { extractTags } from '@/lib/utils'

// --- Zod schemas ---

const createNoteSchema = z.object({
  title: z.string().min(1).max(200),
})

const updateNoteSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

const deleteNoteSchema = z.object({
  id: z.string().uuid(),
})

const getNoteByIdSchema = z.object({
  id: z.string().uuid(),
})

const saveNoteContentSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
})

// --- Types ---

type Note = typeof notes.$inferSelect

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

// --- Server Actions ---

export async function createNote(
  title: string
): Promise<ActionResult<Note>> {
  const parsed = createNoteSchema.safeParse({ title })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const now = Date.now()
  const id = crypto.randomUUID()

  const [created] = db
    .insert(notes)
    .values({
      id,
      title: parsed.data.title,
      content: '',
      tags: '[]',
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .all()

  revalidatePath('/notes')
  return { success: true, data: created }
}

export async function updateNote(
  id: string,
  updates: { title?: string; content?: string; tags?: string[] }
): Promise<ActionResult<Note>> {
  const parsed = updateNoteSchema.safeParse({ id, ...updates })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const existing = db
    .select()
    .from(notes)
    .where(eq(notes.id, parsed.data.id))
    .get()

  if (!existing) {
    return { success: false, error: 'Note not found' }
  }

  const setValues: Record<string, unknown> = { updatedAt: Date.now() }

  if (parsed.data.title !== undefined) {
    setValues.title = parsed.data.title
  }
  if (parsed.data.content !== undefined) {
    setValues.content = parsed.data.content
  }
  if (parsed.data.tags !== undefined) {
    setValues.tags = JSON.stringify(parsed.data.tags)
  }

  const [updated] = db
    .update(notes)
    .set(setValues)
    .where(eq(notes.id, parsed.data.id))
    .returning()
    .all()

  revalidatePath('/notes')
  revalidatePath(`/notes/${id}`)
  return { success: true, data: updated }
}

export async function deleteNote(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const parsed = deleteNoteSchema.safeParse({ id })
  if (!parsed.success) {
    return { success: false, error: 'Invalid note ID' }
  }

  const existing = db
    .select()
    .from(notes)
    .where(eq(notes.id, parsed.data.id))
    .get()

  if (!existing) {
    return { success: false, error: 'Note not found' }
  }

  db.delete(notes).where(eq(notes.id, parsed.data.id)).run()

  revalidatePath('/notes')
  return { success: true, data: { id: parsed.data.id } }
}

export async function getNotes(): Promise<Note[]> {
  return db
    .select()
    .from(notes)
    .orderBy(desc(notes.updatedAt))
    .all()
}

export async function getNoteById(
  id: string
): Promise<Note | undefined> {
  const parsed = getNoteByIdSchema.safeParse({ id })
  if (!parsed.success) {
    return undefined
  }

  return db
    .select()
    .from(notes)
    .where(eq(notes.id, parsed.data.id))
    .get()
}

// --- Auto-save Action ---

export async function saveNoteContent(
  id: string,
  content: string
): Promise<ActionResult<Note>> {
  const parsed = saveNoteContentSchema.safeParse({ id, content })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const existing = db
    .select()
    .from(notes)
    .where(eq(notes.id, parsed.data.id))
    .get()

  if (!existing) {
    return { success: false, error: 'Note not found' }
  }

  const tags = extractTags(parsed.data.content)

  const [updated] = db
    .update(notes)
    .set({
      content: parsed.data.content,
      tags: JSON.stringify(tags),
      updatedAt: Date.now(),
    })
    .where(eq(notes.id, parsed.data.id))
    .returning()
    .all()

  revalidatePath('/notes')
  return { success: true, data: updated }
}
