import { Suspense } from 'react'
import { getNotes } from '@/lib/actions/notes'
import { NotesPageClient } from '@/components/notes/NotesPageClient'
import { NewNoteButton } from '@/components/notes/NewNoteButton'

export const dynamic = 'force-dynamic'

function NotesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="h-40 rounded-[20px] bg-[var(--surface)] animate-pulse"
        />
      ))}
    </div>
  )
}

async function NotesLoader() {
  const notes = await getNotes()
  return <NotesPageClient notes={notes} />
}

export default function NotesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text)]">Notes</h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            Your thoughts, organized
          </p>
        </div>
        <NewNoteButton />
      </header>

      <Suspense fallback={<NotesGridSkeleton />}>
        <NotesLoader />
      </Suspense>
    </div>
  )
}
