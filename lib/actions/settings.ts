'use server'

import { db } from '@/lib/db'
import { settings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

const setSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().max(1000),
})

export async function getSetting(key: string): Promise<string | null> {
  const row = db
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .get()

  return row?.value ?? null
}

export async function setSetting(
  key: string,
  value: string
): Promise<ActionResult<{ key: string; value: string }>> {
  const parsed = setSettingSchema.safeParse({ key, value })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const now = Date.now()
  const existing = db
    .select()
    .from(settings)
    .where(eq(settings.key, parsed.data.key))
    .get()

  if (existing) {
    db.update(settings)
      .set({ value: parsed.data.value, updatedAt: now })
      .where(eq(settings.key, parsed.data.key))
      .run()
  } else {
    db.insert(settings)
      .values({ key: parsed.data.key, value: parsed.data.value, updatedAt: now })
      .run()
  }

  return { success: true, data: { key: parsed.data.key, value: parsed.data.value } }
}

export type ThemeSettings = {
  theme: 'light' | 'dark'
  accentColor: string
}

export async function getThemeSettings(): Promise<ThemeSettings> {
  const theme = await getSetting('theme')
  const accentColor = await getSetting('accentColor')

  return {
    theme: theme === 'dark' ? 'dark' : 'light',
    accentColor: accentColor ?? '#3B82F6',
  }
}
