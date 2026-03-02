'use client'

import { useState, useRef } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { tasks } from '@/db/schema'
import type { InferSelectModel } from 'drizzle-orm'

export type Task = InferSelectModel<typeof tasks>

type TaskItemProps = {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEditText?: (id: string, text: string) => void
  showDate?: boolean
}

export function TaskItem({ task, onToggle, onDelete, onEditText, showDate }: TaskItemProps) {
  const isDone = task.status === 'done'
  const [isEditing, setIsEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDoubleClick = () => {
    if (!onEditText || isDone) return
    setIsEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleEditSubmit = () => {
    const newText = inputRef.current?.value.trim()
    if (newText && newText !== task.text && onEditText) {
      onEditText(task.id, newText)
    }
    setIsEditing(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      data-testid="task-item"
      className="group flex items-center gap-3 bg-[var(--surface)] rounded-xl px-4 py-3 border border-[var(--text-secondary)]/10"
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={() => onToggle(task.id)}
        data-testid="task-checkbox"
        className={cn(
          'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200',
          isDone
            ? 'bg-[var(--accent)] border-[var(--accent)]'
            : 'border-[var(--text-secondary)]/40 hover:border-[var(--accent)]'
        )}
        aria-label={isDone ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {isDone && (
          <svg
            width="10"
            height="8"
            viewBox="0 0 10 8"
            fill="none"
            className="text-white"
            aria-hidden="true"
          >
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Task text */}
      {isEditing ? (
        <input
          ref={inputRef}
          defaultValue={task.text}
          onBlur={handleEditSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleEditSubmit()
            if (e.key === 'Escape') setIsEditing(false)
          }}
          className="flex-1 text-sm bg-transparent border-b border-[var(--accent)] text-[var(--text)] outline-none"
        />
      ) : (
        <span
          onDoubleClick={handleDoubleClick}
          className={cn(
            'flex-1 text-sm transition-all duration-200',
            isDone
              ? 'line-through text-[var(--text-secondary)]'
              : 'text-[var(--text)]',
            onEditText && !isDone && 'cursor-text'
          )}
        >
          {task.text}
        </span>
      )}

      {/* Date badge */}
      {showDate && (
        <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
          {task.date}
        </span>
      )}

      {/* Priority dot */}
      <Badge variant="dot" priority={task.priority as 1 | 2 | 3} data-testid="task-priority-dot" />

      {/* Delete button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2 py-1"
        aria-label="Delete task"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="text-[var(--text-secondary)]"
          aria-hidden="true"
        >
          <path
            d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Button>
    </motion.div>
  )
}
