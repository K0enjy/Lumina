'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Markdown } from '@tiptap/markdown'
import { useCallback, useEffect, useRef, useState } from 'react'
import { saveNoteContent, updateNote } from '@/lib/actions/notes'
import { extractTags } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useZenMode } from '@/components/zen/ZenModeContext'

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
  const pendingSavesRef = useRef(0)
  const { isZen, toggleZen } = useZenMode()

  const debouncedSaveContent = useCallback(
    (content: string) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        pendingSavesRef.current--
      }
      setSaveStatus('saving')
      pendingSavesRef.current++
      saveTimeoutRef.current = setTimeout(async () => {
        saveTimeoutRef.current = null
        await saveNoteContent(id, content)
        pendingSavesRef.current--
        if (pendingSavesRef.current === 0) {
          setSaveStatus('saved')
        }
      }, 1000)
    },
    [id]
  )

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: 'tiptap-code-block' } },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Table,
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({ nested: true }),
      Markdown.configure({
        markedOptions: { gfm: true },
      }),
    ],
    content: initialContent,
    contentType: 'markdown',
    editorProps: {
      attributes: {
        class: 'tiptap-editor prose prose-sm max-w-none focus:outline-none min-h-[300px]',
      },
    },
    onUpdate: ({ editor }) => {
      const markdown = editor.getMarkdown()
      const extracted = extractTags(markdown)
      setTags(extracted)
      debouncedSaveContent(markdown)
    },
  })

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle)
      if (titleTimeoutRef.current) {
        clearTimeout(titleTimeoutRef.current)
        pendingSavesRef.current--
      }
      setSaveStatus('saving')
      pendingSavesRef.current++
      titleTimeoutRef.current = setTimeout(async () => {
        titleTimeoutRef.current = null
        await updateNote(id, { title: newTitle })
        pendingSavesRef.current--
        if (pendingSavesRef.current === 0) {
          setSaveStatus('saved')
        }
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

  // Typewriter scrolling: keep cursor line vertically centered in zen mode
  // Uses requestAnimationFrame to coalesce rapid updates and prevent scroll jank
  const scrollRafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!editor || !isZen) return

    const scrollCursorToCenter = () => {
      if (!editor.view.hasFocus()) return
      if (scrollRafRef.current !== null) {
        cancelAnimationFrame(scrollRafRef.current)
      }
      scrollRafRef.current = requestAnimationFrame(() => {
        scrollRafRef.current = null
        try {
          const { node } = editor.view.domAtPos(editor.state.selection.anchor)
          const element = node instanceof HTMLElement ? node : node.parentElement
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        } catch {
          // domAtPos can throw during editor state transitions
        }
      })
    }

    editor.on('update', scrollCursorToCenter)
    editor.on('selectionUpdate', scrollCursorToCenter)

    return () => {
      editor.off('update', scrollCursorToCenter)
      editor.off('selectionUpdate', scrollCursorToCenter)
      if (scrollRafRef.current !== null) {
        cancelAnimationFrame(scrollRafRef.current)
        scrollRafRef.current = null
      }
    }
  }, [editor, isZen])

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
        <div className="flex items-center gap-3">
          {/* Zen mode toggle button */}
          <button
            type="button"
            onClick={toggleZen}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors',
              isZen
                ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text)]'
            )}
            aria-label="Toggle Zen Mode"
            title="Toggle Zen Mode (Ctrl+J)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M8 3H5a2 2 0 0 0-2 2v3" />
              <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
              <path d="M3 16v3a2 2 0 0 0 2 2h3" />
              <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
            </svg>
          </button>
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
