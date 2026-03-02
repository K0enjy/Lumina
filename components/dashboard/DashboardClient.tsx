'use client'

import { DashboardTasks } from '@/components/dashboard/DashboardTasks'
import { DashboardEvents } from '@/components/dashboard/DashboardEvents'
import { DashboardNotes } from '@/components/dashboard/DashboardNotes'
import type { tasks, notes } from '@/db/schema'
import type { EventWithCalendar } from '@/lib/actions/calendar'
import type { InferSelectModel } from 'drizzle-orm'

type Task = InferSelectModel<typeof tasks>
type Note = InferSelectModel<typeof notes>

type Props = {
  tasks: Task[]
  events: EventWithCalendar[]
  recentNotes: Note[]
}

export function DashboardClient({ tasks, events, recentNotes }: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <DashboardTasks tasks={tasks} />
      <DashboardEvents events={events} />
      <div className="md:col-span-2">
        <DashboardNotes notes={recentNotes} />
      </div>
    </div>
  )
}
