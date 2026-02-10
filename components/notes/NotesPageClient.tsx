'use client'

import { useState, useMemo } from 'react'
import { TagFilter } from '@/components/notes/TagFilter'
import { NoteGrid, type NoteData } from '@/components/notes/NoteGrid'

type NotesPageClientProps = {
  notes: NoteData[]
}

function NotesPageClient({ notes }: NotesPageClientProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    for (const note of notes) {
      const parsed: string[] = note.tags ? JSON.parse(note.tags) : []
      for (const tag of parsed) {
        tagSet.add(tag)
      }
    }
    return Array.from(tagSet).sort()
  }, [notes])

  const filteredNotes = useMemo(() => {
    if (selectedTags.length === 0) return notes
    return notes.filter((note) => {
      const parsed: string[] = note.tags ? JSON.parse(note.tags) : []
      return selectedTags.every((tag) => parsed.includes(tag))
    })
  }, [notes, selectedTags])

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    )
  }

  const handleClear = () => {
    setSelectedTags([])
  }

  return (
    <div className="flex flex-col gap-6">
      <TagFilter
        tags={allTags}
        selectedTags={selectedTags}
        onToggleTag={handleToggleTag}
        onClear={handleClear}
      />
      <NoteGrid notes={filteredNotes} />
    </div>
  )
}

export { NotesPageClient }
