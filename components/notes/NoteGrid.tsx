import { NoteCard } from '@/components/notes/NoteCard'

type NoteData = {
  id: string
  title: string
  content: string | null
  tags: string | null
  createdAt: number
  updatedAt: number
}

type NoteGridProps = {
  notes: NoteData[]
}

function NoteGrid({ notes }: NoteGridProps) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">
          <svg
            className="w-16 h-16 text-[var(--text-secondary)]/30 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-[var(--text)]">No notes yet</h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Create your first note to get started
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map((note) => {
        let tags: string[] = []
        try {
          tags = note.tags ? JSON.parse(note.tags) : []
        } catch {
          tags = []
        }
        return (
          <NoteCard
            key={note.id}
            id={note.id}
            title={note.title}
            content={note.content}
            tags={tags}
            updatedAt={note.updatedAt}
          />
        )
      })}
    </div>
  )
}

export { NoteGrid }
export type { NoteGridProps, NoteData }
