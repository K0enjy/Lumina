'use client'

import { useOptimistic, useTransition, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { TaskItem } from '@/components/tasks/TaskItem'
import { AddTask } from '@/components/tasks/AddTask'
import { createTask, toggleTask, deleteTask } from '@/lib/actions/tasks'
import { tasks } from '@/db/schema'
import type { InferSelectModel } from 'drizzle-orm'

type Task = InferSelectModel<typeof tasks>

type OptimisticAction =
  | { type: 'add'; task: Task }
  | { type: 'toggle'; id: string }
  | { type: 'delete'; id: string }
  | { type: 'reorder'; id: string }

function sortTasks(taskList: Task[], reorderingIds: Set<string>): Task[] {
  const pending: Task[] = []
  const completed: Task[] = []

  for (const task of taskList) {
    if (task.status === 'done' && !reorderingIds.has(task.id)) {
      completed.push(task)
    } else {
      pending.push(task)
    }
  }

  pending.sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'todo' ? -1 : 1
    }
    if (a.priority !== b.priority) return b.priority - a.priority
    return b.createdAt - a.createdAt
  })

  completed.sort((a, b) => b.updatedAt - a.updatedAt)

  return [...pending, ...completed]
}

type TaskListProps = {
  tasks: Task[]
}

export function TaskList({ tasks: serverTasks }: TaskListProps) {
  const [isPending, startTransition] = useTransition()
  const reorderTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const reorderingIds = useRef<Set<string>>(new Set())

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
        case 'reorder':
          return state
        default:
          return state
      }
    }
  )

  const sortedTasks = sortTasks(optimisticTasks, reorderingIds.current)

  const handleAdd = useCallback((text: string, priority: number) => {
    const today = new Date().toISOString().split('T')[0]
    const now = Date.now()
    const tempId = crypto.randomUUID()

    const tempTask: Task = {
      id: tempId,
      text,
      status: 'todo',
      priority,
      date: today,
      createdAt: now,
      updatedAt: now,
    }

    startTransition(async () => {
      setOptimisticTasks({ type: 'add', task: tempTask })
      await createTask(text, priority, today)
    })
  }, [setOptimisticTasks])

  const handleToggle = useCallback((id: string) => {
    const task = optimisticTasks.find(t => t.id === id)
    if (!task) return

    const isCompletingTask = task.status === 'todo'

    // Clear any existing reorder timeout for this task
    const existingTimeout = reorderTimeouts.current.get(id)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
      reorderTimeouts.current.delete(id)
      reorderingIds.current.delete(id)
    }

    if (isCompletingTask) {
      // Mark as done but keep in pending section temporarily
      reorderingIds.current.add(id)

      const timeout = setTimeout(() => {
        reorderingIds.current.delete(id)
        reorderTimeouts.current.delete(id)
        // Trigger a re-render to move the task to the bottom
        startTransition(async () => {
          setOptimisticTasks({ type: 'reorder', id })
        })
      }, 1000)

      reorderTimeouts.current.set(id, timeout)
    }

    startTransition(async () => {
      setOptimisticTasks({ type: 'toggle', id })
      await toggleTask(id)
    })
  }, [optimisticTasks, setOptimisticTasks])

  const handleDelete = useCallback((id: string) => {
    // Clear any reorder timeout for this task
    const existingTimeout = reorderTimeouts.current.get(id)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
      reorderTimeouts.current.delete(id)
      reorderingIds.current.delete(id)
    }

    startTransition(async () => {
      setOptimisticTasks({ type: 'delete', id })
      await deleteTask(id)
    })
  }, [setOptimisticTasks])

  return (
    <div className="flex flex-col gap-3">
      <AddTask onAdd={handleAdd} />

      {sortedTasks.length === 0 ? (
        <p className="text-center text-[var(--text-secondary)] text-sm py-12">
          No tasks for today
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {sortedTasks.map(task => (
              <motion.div
                key={task.id}
                layout
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <TaskItem
                  task={task}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
