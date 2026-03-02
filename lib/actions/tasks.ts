'use server'

import { db } from '@/lib/db'
import { tasks } from '@/db/schema'
import { revalidatePath } from 'next/cache'
import { eq, and, desc, gte, lte } from 'drizzle-orm'
import { z } from 'zod'

// --- Zod schemas ---

const createTaskSchema = z.object({
  text: z.string().min(1).max(500),
  priority: z.number().int().min(1).max(3).default(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

const toggleTaskSchema = z.object({
  id: z.string().uuid(),
})

const updatePrioritySchema = z.object({
  id: z.string().uuid(),
  priority: z.number().int().min(1).max(3),
})

const deleteTaskSchema = z.object({
  id: z.string().uuid(),
})

const getTasksByDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

const updateTaskTextSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(1).max(500),
})

const updateTaskDateSchema = z.object({
  id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

const getAllTasksSchema = z.object({
  status: z.enum(['todo', 'done']).optional(),
  priority: z.number().int().min(1).max(3).optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).optional()

// --- Types ---

export type ActionSuccess<T> = { success: true; data: T }
export type ActionError = { success: false; error: string }
export type ActionResult<T> = ActionSuccess<T> | ActionError

// --- Server Actions ---

export async function createTask(
  text: string,
  priority: number = 1,
  date: string
): Promise<ActionResult<typeof tasks.$inferSelect>> {
  const parsed = createTaskSchema.safeParse({ text, priority, date })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const now = Date.now()
  const id = crypto.randomUUID()

  const [created] = db
    .insert(tasks)
    .values({
      id,
      text: parsed.data.text,
      status: 'todo',
      priority: parsed.data.priority,
      date: parsed.data.date,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .all()

  revalidatePath('/')
  revalidatePath('/tasks')
  return { success: true, data: created }
}

export async function toggleTask(
  id: string
): Promise<ActionResult<typeof tasks.$inferSelect>> {
  const parsed = toggleTaskSchema.safeParse({ id })
  if (!parsed.success) {
    return { success: false, error: 'Invalid task ID' }
  }

  const task = db
    .select()
    .from(tasks)
    .where(eq(tasks.id, parsed.data.id))
    .get()

  if (!task) {
    return { success: false, error: 'Task not found' }
  }

  const [updated] = db
    .update(tasks)
    .set({
      status: task.status === 'todo' ? 'done' : 'todo',
      updatedAt: Date.now(),
    })
    .where(eq(tasks.id, parsed.data.id))
    .returning()
    .all()

  revalidatePath('/')
  revalidatePath('/tasks')
  return { success: true, data: updated }
}

export async function updateTaskPriority(
  id: string,
  priority: number
): Promise<ActionResult<typeof tasks.$inferSelect>> {
  const parsed = updatePrioritySchema.safeParse({ id, priority })
  if (!parsed.success) {
    return { success: false, error: 'Invalid input' }
  }

  const task = db
    .select()
    .from(tasks)
    .where(eq(tasks.id, parsed.data.id))
    .get()

  if (!task) {
    return { success: false, error: 'Task not found' }
  }

  const [updated] = db
    .update(tasks)
    .set({
      priority: parsed.data.priority,
      updatedAt: Date.now(),
    })
    .where(eq(tasks.id, parsed.data.id))
    .returning()
    .all()

  revalidatePath('/')
  revalidatePath('/tasks')
  return { success: true, data: updated }
}

export async function deleteTask(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const parsed = deleteTaskSchema.safeParse({ id })
  if (!parsed.success) {
    return { success: false, error: 'Invalid task ID' }
  }

  const task = db
    .select()
    .from(tasks)
    .where(eq(tasks.id, parsed.data.id))
    .get()

  if (!task) {
    return { success: false, error: 'Task not found' }
  }

  db.delete(tasks).where(eq(tasks.id, parsed.data.id)).run()

  revalidatePath('/')
  revalidatePath('/tasks')
  return { success: true, data: { id: parsed.data.id } }
}

export async function getTasksByDate(
  date: string
): Promise<typeof tasks.$inferSelect[]> {
  const parsed = getTasksByDateSchema.safeParse({ date })
  if (!parsed.success) {
    return []
  }

  return db
    .select()
    .from(tasks)
    .where(eq(tasks.date, parsed.data.date))
    .all()
}

export type TaskFilters = z.infer<NonNullable<typeof getAllTasksSchema>>

export async function getAllTasks(
  filters?: TaskFilters
): Promise<typeof tasks.$inferSelect[]> {
  const parsed = getAllTasksSchema.safeParse(filters)
  const f = parsed.success ? parsed.data : undefined

  const conditions = []
  if (f?.status) conditions.push(eq(tasks.status, f.status))
  if (f?.priority) conditions.push(eq(tasks.priority, f.priority))
  if (f?.dateFrom) conditions.push(gte(tasks.date, f.dateFrom))
  if (f?.dateTo) conditions.push(lte(tasks.date, f.dateTo))

  const query = db
    .select()
    .from(tasks)
    .orderBy(desc(tasks.date), desc(tasks.priority))

  if (conditions.length > 0) {
    return query.where(and(...conditions)).all()
  }

  return query.all()
}

export async function updateTaskText(
  id: string,
  text: string
): Promise<ActionResult<typeof tasks.$inferSelect>> {
  const parsed = updateTaskTextSchema.safeParse({ id, text })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const task = db
    .select()
    .from(tasks)
    .where(eq(tasks.id, parsed.data.id))
    .get()

  if (!task) {
    return { success: false, error: 'Task not found' }
  }

  const [updated] = db
    .update(tasks)
    .set({ text: parsed.data.text, updatedAt: Date.now() })
    .where(eq(tasks.id, parsed.data.id))
    .returning()
    .all()

  revalidatePath('/')
  revalidatePath('/tasks')
  return { success: true, data: updated }
}

export async function updateTaskDate(
  id: string,
  date: string
): Promise<ActionResult<typeof tasks.$inferSelect>> {
  const parsed = updateTaskDateSchema.safeParse({ id, date })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const task = db
    .select()
    .from(tasks)
    .where(eq(tasks.id, parsed.data.id))
    .get()

  if (!task) {
    return { success: false, error: 'Task not found' }
  }

  const [updated] = db
    .update(tasks)
    .set({ date: parsed.data.date, updatedAt: Date.now() })
    .where(eq(tasks.id, parsed.data.id))
    .returning()
    .all()

  revalidatePath('/')
  revalidatePath('/tasks')
  return { success: true, data: updated }
}

export async function deleteCompletedTasks(): Promise<
  ActionResult<{ deletedCount: number }>
> {
  const deleted = db
    .delete(tasks)
    .where(eq(tasks.status, 'done'))
    .returning()
    .all()

  revalidatePath('/')
  revalidatePath('/tasks')
  return { success: true, data: { deletedCount: deleted.length } }
}
