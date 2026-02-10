'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { saveNoteContent } from '@/lib/actions/notes'

type UseAutoSaveReturn = {
  isSaving: boolean
  lastSavedAt: number | null
}

export function useAutoSave(
  noteId: string,
  content: string,
  delay: number = 1000
): UseAutoSaveReturn {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestContentRef = useRef(content)
  const noteIdRef = useRef(noteId)
  const isInitialRef = useRef(true)

  latestContentRef.current = content
  noteIdRef.current = noteId

  const save = useCallback(async () => {
    timeoutRef.current = null
    setIsSaving(true)
    try {
      await saveNoteContent(noteIdRef.current, latestContentRef.current)
      setLastSavedAt(Date.now())
    } finally {
      setIsSaving(false)
    }
  }, [])

  useEffect(() => {
    // Skip the initial render — don't save the content we just loaded
    if (isInitialRef.current) {
      isInitialRef.current = false
      return
    }

    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(save, delay)
  }, [content, delay, save])

  useEffect(() => {
    const flush = () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
        // Use synchronous XHR-style flush via navigator.sendBeacon is unreliable
        // for server actions. Instead, trigger the save synchronously.
        // The save function is async but beforeunload doesn't await — this is
        // the best-effort approach. We call saveNoteContent directly.
        saveNoteContent(noteIdRef.current, latestContentRef.current)
      }
    }

    window.addEventListener('beforeunload', flush)

    return () => {
      window.removeEventListener('beforeunload', flush)
      // Cancel pending save on unmount
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [])

  return { isSaving, lastSavedAt }
}
