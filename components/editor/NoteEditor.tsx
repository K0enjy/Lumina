'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { useCallback, useEffect, useRef, useState } from 'react'
import { saveNoteContent, updateNote } from '@/lib/actions/notes'
import { extractTags } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type NoteEditorProps = {
  id: string
  initialTitle: string
  initialContent: string
  initialTags: string[]
}

export function NoteEditor({ id, initialTitle, initialContent, initialTags }: NoteEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle')
  const [tags, setTags] = useState<string[]>(initialTags)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const titleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: 'tiptap-code-block' } },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Markdown.configure({
        html: false,
        tightLists: true,
        bulletListMarker: '-',
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'tiptap-editor prose prose-sm max-w-none focus:outline-none min-h-[300px]',
      },
    },
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown.getMarkdown() as string
      const extracted = extractTags(markdown)
      setTags(extracted)
      debouncedSaveContent(markdown)
    },
  })

  const debouncedSaveContent = useCallback(
    (content: string) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      setSaveStatus('saving')
      saveTimeoutRef.current = setTimeout(async () => {
        await saveNoteContent(id, content)
        setSaveStatus('saved')
      }, 1000)
    },
    [id]
  )

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle)
      if (titleTimeoutRef.current) {
        clearTimeout(titleTimeoutRef.current)
      }
      setSaveStatus('saving')
      titleTimeoutRef.current = setTimeout(async () => {
        await updateNote(id, { title: newTitle })
        setSaveStatus('saved')
      }, 1000)
    },
    [id]
  )

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current)
    }
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/notes"
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          Back to notes
        </Link>
        <span
          className={cn(
            'text-xs transition-opacity duration-200',
            saveStatus === 'idle' ? 'opacity-0' : 'opacity-100',
            saveStatus === 'saving' ? 'text-text-secondary' : 'text-green-500'
          )}
        >
          {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
        </span>
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        placeholder="Untitled"
        className="w-full text-3xl font-bold text-text bg-transparent border-none outline-none placeholder:text-text-secondary/50 mb-4"
      />

      {/* Editor */}
      <div className="flex-1 bg-surface rounded-[20px] border border-border/50 p-6 mb-4">
        <EditorContent editor={editor} />
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="tag">
              #{tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
