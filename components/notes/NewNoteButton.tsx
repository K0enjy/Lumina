'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { createNote } from '@/lib/actions/notes'

function NewNoteButton() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleCreate = () => {
    startTransition(async () => {
      const result = await createNote('Untitled')
      if (result.success) {
        router.push(`/notes/${result.data.id}`)
      }
    })
  }

  return (
    <Button onClick={handleCreate} disabled={isPending}>
      <svg
        className="w-4 h-4 mr-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      {isPending ? 'Creating...' : 'New Note'}
    </Button>
  )
}

export { NewNoteButton }
