'use client'

import Link from 'next/link'
import type { notes } from '@/db/schema'
import type { InferSelectModel } from 'drizzle-orm'

type Note = InferSelectModel<typeof notes>

type Props = {
  notes: Note[]
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').slice(0, 120)
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function DashboardNotes({ notes }: Props) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[var(--text)]">Recent Notes</h2>
        <Link href="/notes" className="text-sm text-[var(--accent)] hover:underline">
          View all &rarr;
        </Link>
      </div>

      {notes.length === 0 ? (
        <p className="text-center text-[var(--text-secondary)] text-sm py-8">
          No notes yet
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {notes.map(note => {
            const tags: string[] = (() => {
              try { return JSON.parse(note.tags ?? '[]') }
              catch { return [] }
            })()

            return (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className="rounded-xl border border-[var(--text-secondary)]/10 p-4 hover:bg-[var(--bg)] transition-colors"
              >
                <h3 className="text-sm font-medium text-[var(--text)] truncate">{note.title}</h3>
                {note.content && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                    {stripHtml(note.content)}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-[var(--text-secondary)]">{formatDate(note.updatedAt)}</span>
                  {tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-xs bg-[var(--accent)]/10 text-[var(--accent)] px-1.5 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
