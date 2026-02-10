'use client'

import dynamic from 'next/dynamic'

const NoteEditor = dynamic(
  () => import('@/components/editor/NoteEditor').then((mod) => mod.NoteEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="h-4 w-24 rounded bg-[var(--surface)]" />
          <div className="h-4 w-16 rounded bg-[var(--surface)]" />
        </div>
        <div className="h-10 w-3/4 rounded bg-[var(--surface)] mb-4" />
        <div className="flex-1 min-h-[300px] rounded-[20px] bg-[var(--surface)]" />
      </div>
    ),
  }
)

export { NoteEditor as LazyNoteEditor }
