'use client'

import { useOptimistic, useTransition, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { TaskItem } from '@/components/tasks/TaskItem'
import { AddTask } from '@/components/tasks/AddTask'
import {
  createTask,
  toggleTask,
  deleteTask,
  deleteCompletedTasks,
  updateTaskText,
} from '@/lib/actions/tasks'
import { tasks } from '@/db/schema'
import type { InferSelectModel } from 'drizzle-orm'

type Task = InferSelectModel<typeof tasks>

type StatusFilter = 'all' | 'todo' | 'done'
type PriorityFilter = 0 | 1 | 2 | 3

type OptimisticAction =
  | { type: 'add'; task: Task }
  | { type: 'toggle'; id: string }
  | { type: 'delete'; id: string }
  | { type: 'deleteCompleted' }
  | { type: 'editText'; id: string; text: string }

function groupTasks(taskList: Task[]): {
  today: Task[]
  tomorrow: Task[]
  thisWeek: Task[]
  later: Task[]
  completed: Task[]
} {
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const endOfWeek = new Date(now)
  const dayOfWeek = now.getDay()
  endOfWeek.setDate(now.getDate() + (7 - dayOfWeek))
  const endOfWeekStr = endOfWeek.toISOString().split('T')[0]

  const groups = {
    today: [] as Task[],
    tomorrow: [] as Task[],
    thisWeek: [] as Task[],
    later: [] as Task[],
    completed: [] as Task[],
  }

  for (const task of taskList) {
    if (task.status === 'done') {
      groups.completed.push(task)
    } else if (task.date === todayStr) {
      groups.today.push(task)
    } else if (task.date === tomorrowStr) {
      groups.tomorrow.push(task)
    } else if (task.date <= endOfWeekStr && task.date > tomorrowStr) {
      groups.thisWeek.push(task)
    } else {
      groups.later.push(task)
    }
  }

  const sortPending = (a: Task, b: Task) => {
    if (a.priority !== b.priority) return b.priority - a.priority
    return a.date.localeCompare(b.date)
  }

  groups.today.sort(sortPending)
  groups.tomorrow.sort(sortPending)
  groups.thisWeek.sort(sortPending)
  groups.later.sort(sortPending)
  groups.completed.sort((a, b) => b.updatedAt - a.updatedAt)

  return groups
}

type Props = {
  tasks: Task[]
}

export function TasksPageClient({ tasks: serverTasks }: Props) {
  const [isPending, startTransition] = useTransition()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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
        case 'deleteCompleted':
          return state.filter(t => t.status !== 'done')
        case 'editText':
          return state.map(t =>
            t.id === action.id ? { ...t, text: action.text, updatedAt: Date.now() } : t
          )
        default:
          return state
      }
    }
  )

  const filtered = optimisticTasks.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (priorityFilter !== 0 && t.priority !== priorityFilter) return false
    return true
  })

  const groups = groupTasks(filtered)

  const handleAdd = useCallback((text: string, priority: number, date?: string) => {
    const taskDate = date || new Date().toISOString().split('T')[0]
    const now = Date.now()
    const tempId = crypto.randomUUID()

    const tempTask: Task = {
      id: tempId,
      text,
      status: 'todo',
      priority,
      date: taskDate,
      createdAt: now,
      updatedAt: now,
    }

    startTransition(async () => {
      setOptimisticTasks({ type: 'add', task: tempTask })
      await createTask(text, priority, taskDate)
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

  const handleDeleteCompleted = useCallback(() => {
    setShowDeleteConfirm(false)
    startTransition(async () => {
      setOptimisticTasks({ type: 'deleteCompleted' })
      await deleteCompletedTasks()
    })
  }, [setOptimisticTasks])

  const handleEditText = useCallback((id: string, text: string) => {
    startTransition(async () => {
      setOptimisticTasks({ type: 'editText', id, text })
      await updateTaskText(id, text)
    })
  }, [setOptimisticTasks])

  const filterBtnClass = (active: boolean) =>
    `px-3 py-1.5 text-sm rounded-lg transition-colors ${
      active
        ? 'bg-[var(--accent)] text-white'
        : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text)]'
    }`

  const renderSection = (title: string, tasks: Task[]) => {
    if (tasks.length === 0) return null
    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide px-1">
          {title}
        </h3>
        <AnimatePresence initial={false}>
          {tasks.map(task => (
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
                onEditText={handleEditText}
                showDate
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <AddTask onAdd={handleAdd} showDatePicker />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button className={filterBtnClass(statusFilter === 'all')} onClick={() => setStatusFilter('all')}>All</button>
        <button className={filterBtnClass(statusFilter === 'todo')} onClick={() => setStatusFilter('todo')}>To do</button>
        <button className={filterBtnClass(statusFilter === 'done')} onClick={() => setStatusFilter('done')}>Done</button>
        <span className="w-px h-5 bg-[var(--border)] mx-1" />
        <button className={filterBtnClass(priorityFilter === 0)} onClick={() => setPriorityFilter(0)}>Any priority</button>
        <button className={filterBtnClass(priorityFilter === 3)} onClick={() => setPriorityFilter(3)}>High</button>
        <button className={filterBtnClass(priorityFilter === 2)} onClick={() => setPriorityFilter(2)}>Medium</button>
        <button className={filterBtnClass(priorityFilter === 1)} onClick={() => setPriorityFilter(1)}>Low</button>
      </div>

      {/* Task sections */}
      <div className="flex flex-col gap-6">
        {renderSection('Today', groups.today)}
        {renderSection('Tomorrow', groups.tomorrow)}
        {renderSection('This week', groups.thisWeek)}
        {renderSection('Later', groups.later)}

        {groups.completed.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                Completed ({groups.completed.length})
              </h3>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                >
                  Delete all completed
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-500">Are you sure?</span>
                  <button
                    onClick={handleDeleteCompleted}
                    className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    Yes, delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-xs px-2 py-1 rounded bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <AnimatePresence initial={false}>
              {groups.completed.map(task => (
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
                    showDate
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {filtered.length === 0 && (
          <p className="text-center text-[var(--text-secondary)] text-sm py-12">
            No tasks found
          </p>
        )}
      </div>
    </div>
  )
}
