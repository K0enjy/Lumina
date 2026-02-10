'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { searchAll, type SearchResult } from '@/lib/actions/search'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

function CheckboxIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}

function CommandPalette() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Group results by type
  const taskResults = results.filter((r): r is SearchResult & { type: 'task' } => r.type === 'task')
  const noteResults = results.filter((r): r is SearchResult & { type: 'note' } => r.type === 'note')

  // Flat list for keyboard navigation
  const flatResults = [...taskResults, ...noteResults]

  const close = useCallback(() => setIsOpen(false), [])

  // Debounced search using useTransition
  const performSearch = useCallback((searchQuery: string) => {
    startTransition(async () => {
      const result = await searchAll(searchQuery)
      if (result.success) {
        setResults(result.data)
      }
    })
  }, [])

  // Reset selectedIndex when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Handle input changes with 200ms debounce
  const handleInputChange = useCallback((value: string) => {
    setQuery(value)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      performSearch(value)
    }, 200)
  }, [performSearch])

  // Global keyboard shortcut: CMD/Ctrl+K to toggle, ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
    }
    return () => {
      document.body.classList.remove('overflow-hidden')
    }
  }, [isOpen])

  // Auto-focus input and load recent items on open
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
      performSearch('')
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen, performSearch])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  // Navigate to selected result
  const navigateToResult = useCallback((result: SearchResult) => {
    setIsOpen(false)
    if (result.type === 'task') {
      router.push('/')
    } else {
      router.push(`/notes/${result.id}`)
    }
  }, [router])

  // Keyboard navigation inside the modal
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) =>
        flatResults.length === 0 ? 0 : (prev + 1) % flatResults.length
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) =>
        flatResults.length === 0 ? 0 : (prev - 1 + flatResults.length) % flatResults.length
      )
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (flatResults[selectedIndex]) {
        navigateToResult(flatResults[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    }
  }, [flatResults, selectedIndex, navigateToResult, close])

  // Scroll active item into view
  const activeItemRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  // Track the running section index for mapping flat index to section rows
  let runningIndex = 0

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={close}
          />

          {/* Dialog */}
          <motion.div
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--bg)] shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.25 }}
            onKeyDown={handleKeyDown}
          >
            {/* Search Input */}
            <div className="relative flex items-center border-b border-[var(--border)] px-4">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-[var(--text-secondary)]"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Search tasks and notes..."
                className="flex-1 bg-transparent py-3.5 pl-3 pr-2 text-[var(--text)] placeholder:text-[var(--text-secondary)]/60 focus:outline-none"
              />
              <kbd className="hidden shrink-0 select-none items-center gap-0.5 rounded-md border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-xs text-[var(--text-secondary)] sm:inline-flex">
                <span className="text-[10px]">&#8984;</span>K
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto p-2">
              {isPending && (
                <div className="flex items-center justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
                  <span className="ml-2 text-sm text-[var(--text-secondary)]">Searching...</span>
                </div>
              )}

              {!isPending && query.trim() === '' && flatResults.length === 0 && (
                <div className="py-8 text-center text-sm text-[var(--text-secondary)]">
                  Type to search tasks and notes...
                </div>
              )}

              {!isPending && query.trim() !== '' && flatResults.length === 0 && (
                <div className="py-8 text-center text-sm text-[var(--text-secondary)]">
                  No results found
                </div>
              )}

              {!isPending && taskResults.length > 0 && (
                <div className="mb-1">
                  <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Tasks
                  </div>
                  {taskResults.map((result) => {
                    const index = runningIndex++
                    return (
                      <button
                        key={result.id}
                        ref={index === selectedIndex ? activeItemRef : undefined}
                        type="button"
                        onClick={() => navigateToResult(result)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                          index === selectedIndex
                            ? 'bg-[var(--accent)]/10 text-[var(--text)]'
                            : 'text-[var(--text)] hover:bg-[var(--surface)]'
                        )}
                      >
                        <span className="shrink-0 text-[var(--text-secondary)]">
                          <CheckboxIcon />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            {result.displayTitle}
                          </div>
                          {result.previewSnippet !== result.displayTitle && (
                            <div className="truncate text-xs text-[var(--text-secondary)]">
                              {result.previewSnippet}
                            </div>
                          )}
                        </div>
                        <span className="shrink-0 text-xs text-[var(--text-secondary)]">Task</span>
                        <Badge
                          variant="dot"
                          priority={result.priority as 1 | 2 | 3}
                        />
                      </button>
                    )
                  })}
                </div>
              )}

              {!isPending && noteResults.length > 0 && (
                <div className="mb-1">
                  <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Notes
                  </div>
                  {noteResults.map((result) => {
                    const index = runningIndex++
                    return (
                      <button
                        key={result.id}
                        ref={index === selectedIndex ? activeItemRef : undefined}
                        type="button"
                        onClick={() => navigateToResult(result)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                          index === selectedIndex
                            ? 'bg-[var(--accent)]/10 text-[var(--text)]'
                            : 'text-[var(--text)] hover:bg-[var(--surface)]'
                        )}
                      >
                        <span className="shrink-0 text-[var(--text-secondary)]">
                          <DocumentIcon />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            {result.displayTitle}
                          </div>
                          {result.previewSnippet && (
                            <div className="truncate text-xs text-[var(--text-secondary)]">
                              {result.previewSnippet}
                            </div>
                          )}
                        </div>
                        <span className="shrink-0 text-xs text-[var(--text-secondary)]">Note</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 border-t border-[var(--border)] px-4 py-2 text-xs text-[var(--text-secondary)]">
              <span className="inline-flex items-center gap-1">
                <kbd className="rounded border border-[var(--border)] bg-[var(--surface)] px-1 py-0.5 text-[10px]">&#8593;</kbd>
                <kbd className="rounded border border-[var(--border)] bg-[var(--surface)] px-1 py-0.5 text-[10px]">&#8595;</kbd>
                navigate
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="rounded border border-[var(--border)] bg-[var(--surface)] px-1 py-0.5 text-[10px]">&#8629;</kbd>
                open
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="rounded border border-[var(--border)] bg-[var(--surface)] px-1 py-0.5 text-[10px]">esc</kbd>
                close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export { CommandPalette }
