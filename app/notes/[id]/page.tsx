import { Suspense } from 'react'
import { getNoteById } from '@/lib/actions/notes'
import { LazyNoteEditor } from '@/components/editor/LazyNoteEditor'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

function NoteEditorSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Title skeleton */}
      <div className="h-10 w-2/3 rounded-lg bg-[var(--surface)] animate-pulse" />
      {/* Tags skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="h-6 w-16 rounded-full bg-[var(--surface)] animate-pulse"
          />
        ))}
      </div>
      {/* Editor body skeleton */}
      <div className="flex flex-col gap-2 mt-2">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div
            key={i}
            className="h-4 rounded bg-[var(--surface)] animate-pulse"
            style={{ width: `${85 - i * 8}%` }}
          />
        ))}
      </div>
    </div>
  )
}

async function NoteEditorLoader({ id }: { id: string }) {
  const note = await getNoteById(id)

  if (!note) {
    notFound()
  }

  const tags: string[] = (() => {
    try {
      return JSON.parse(note.tags ?? '[]')
    } catch {
      return []
    }
  })()

  return (
    <LazyNoteEditor
      id={note.id}
      initialTitle={note.title}
      initialContent={note.content ?? ''}
      initialTags={tags}
    />
  )
}

export default async function NoteEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <main className="flex flex-col h-full p-6 max-w-4xl mx-auto w-full">
      <Suspense fallback={<NoteEditorSkeleton />}>
        <NoteEditorLoader id={id} />
      </Suspense>
    </main>
  )
}
