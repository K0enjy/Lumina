import { getNoteById } from '@/lib/actions/notes'
import { NoteEditor } from '@/components/editor/NoteEditor'
import { notFound } from 'next/navigation'

export default async function NoteEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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
    <main className="flex flex-col h-full p-6 max-w-4xl mx-auto w-full">
      <NoteEditor
        id={note.id}
        initialTitle={note.title}
        initialContent={note.content ?? ''}
        initialTags={tags}
      />
    </main>
  )
}
