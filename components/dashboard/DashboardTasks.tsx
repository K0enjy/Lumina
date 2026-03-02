'use client'

import { useOptimistic, useTransition, useCallback } from 'react'
import Link from 'next/link'
import { TaskItem } from '@/components/tasks/TaskItem'
import { AddTask } from '@/components/tasks/AddTask'
import { createTask, toggleTask, deleteTask } from '@/lib/actions/tasks'
import type { tasks } from '@/db/schema'
import type { InferSelectModel } from 'drizzle-orm'

type Task = InferSelectModel<typeof tasks>

type OptimisticAction =
  | { type: 'add'; task: Task }
  | { type: 'toggle'; id: string }
  | { type: 'delete'; id: string }

type Props = {
  tasks: Task[]
}

export function DashboardTasks({ tasks: serverTasks }: Props) {
  const [, startTransition] = useTransition()

  const [optimisticTasks, setOptimisticTasks] = useOptimistic(
    serverTasks,
    (state: Task[], action: OptimisticAction) => {
      switch (action.type) {
        case 'add':
          return [action.task, ...state]
        case 'toggle':
          return state.map(t =>
            t.id === action.id
              ? { ...t, status: (t.status === 'todo' ? 'done' : 'todo') as 'todo' | 'done', updatedAt: Date.now() }
              : t
          )
        case 'delete':
          return state.filter(t => t.id !== action.id)
        default:
          return state
      }
    }
  )

  const sorted = [...optimisticTasks].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'todo' ? -1 : 1
    return b.priority - a.priority
  })

  const handleAdd = useCallback((text: string, priority: number) => {
    const today = new Date().toISOString().split('T')[0]
    const now = Date.now()
    const tempId = crypto.randomUUID()
    const tempTask: Task = { id: tempId, text, status: 'todo', priority, date: today, createdAt: now, updatedAt: now }

    startTransition(async () => {
      setOptimisticTasks({ type: 'add', task: tempTask })
      await createTask(text, priority, today)
    })
  }, [setOptimisticTasks])

  const handleToggle = useCallback((id: string) => {
    startTransition(async () => {
      setOptimisticTasks({ type: 'toggle', id })
      await toggleTask(id)
    })
  }, [setOptimisticTasks])

  const handleDelete = useCallback((id: string) => {
    startTransition(async () => {
      setOptimisticTasks({ type: 'delete', id })
      await deleteTask(id)
    })
  }, [setOptimisticTasks])

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[var(--text)]">Tasks</h2>
        <Link href="/tasks" className="text-sm text-[var(--accent)] hover:underline">
          View all &rarr;
        </Link>
      </div>

      <AddTask onAdd={handleAdd} />

      {sorted.length === 0 ? (
        <p className="text-center text-[var(--text-secondary)] text-sm py-8">
          No tasks for today
        </p>
      ) : (
        <div className="flex flex-col gap-2 mt-3">
          {sorted.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
