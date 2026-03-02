'use client'

import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

type AddTaskProps = {
  onAdd: (text: string, priority: number, date?: string) => void
  showDatePicker?: boolean
}

const priorities = [
  { value: 1, color: 'bg-green-400', label: 'Low priority' },
  { value: 2, color: 'bg-yellow-400', label: 'Medium priority' },
  { value: 3, color: 'bg-red-400', label: 'High priority' },
] as const

export function AddTask({ onAdd, showDatePicker }: AddTaskProps) {
  const [priority, setPriority] = useState(1)
  const [date, setDate] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = inputRef.current?.value.trim()
    if (!text) return

    onAdd(text, priority, date || undefined)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    setPriority(1)
    setDate('')
    inputRef.current?.focus()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-center gap-3 bg-[var(--surface)] rounded-[20px] px-4 py-3"
    >
      <Input
        ref={inputRef}
        placeholder="Add a task..."
        data-testid="add-task-input"
        className="flex-1 min-w-[160px] border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
      />

      {showDatePicker && (
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-[var(--border)] bg-transparent text-[var(--text)] text-sm rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
      )}

      <div className="flex items-center gap-2">
        {priorities.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPriority(p.value)}
            data-testid={`add-task-priority-${p.value}`}
            className={cn(
              'w-4 h-4 rounded-full transition-all duration-200',
              p.color,
              priority === p.value
                ? 'ring-2 ring-offset-2 ring-offset-[var(--surface)] ring-[var(--text-secondary)]'
                : 'opacity-50 hover:opacity-75'
            )}
            aria-label={p.label}
            aria-pressed={priority === p.value}
          />
        ))}
      </div>

      <Button type="submit" variant="primary" size="sm" data-testid="add-task-submit">
        Add
      </Button>
    </form>
  )
}
