import { Suspense } from 'react'
import { getAllTasks } from '@/lib/actions/tasks'
import { TasksPageClient } from '@/components/tasks/TasksPageClient'

export const dynamic = 'force-dynamic'

function TasksSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="h-12 rounded-[20px] bg-[var(--surface)] animate-pulse" />
      <div className="flex flex-col gap-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="h-14 rounded-[20px] bg-[var(--surface)] animate-pulse"
          />
        ))}
      </div>
    </div>
  )
}

async function TasksLoader() {
  const tasks = await getAllTasks()
  return <TasksPageClient tasks={tasks} />
}

export default function TasksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text)]">Tasks</h1>
        <p className="mt-1 text-[var(--text-secondary)]">All your tasks in one place</p>
      </header>

      <Suspense fallback={<TasksSkeleton />}>
        <TasksLoader />
      </Suspense>
    </div>
  )
}
