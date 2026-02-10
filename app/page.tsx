import { Suspense } from 'react'
import { getTasksByDate, archiveCompletedTasks } from '@/lib/actions/tasks'
import { TaskList } from '@/components/tasks/TaskList'

export const dynamic = 'force-dynamic'

function TaskListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {/* AddTask skeleton */}
      <div className="h-12 rounded-[20px] bg-[var(--surface)] animate-pulse" />
      {/* Task item skeletons */}
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="h-14 rounded-[20px] bg-[var(--surface)] animate-pulse"
          />
        ))}
      </div>
    </div>
  )
}

async function TaskListLoader() {
  await archiveCompletedTasks()
  const today = new Date().toISOString().split('T')[0]
  const tasks = await getTasksByDate(today)
  return <TaskList tasks={tasks} />
}

export default function TodayPage() {
  const now = new Date()
  const formatted = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text)]">Today</h1>
        <p className="mt-1 text-[var(--text-secondary)]">{formatted}</p>
      </header>

      <Suspense fallback={<TaskListSkeleton />}>
        <TaskListLoader />
      </Suspense>
    </main>
  )
}
