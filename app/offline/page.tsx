'use client'

import * as m from 'motion/react-m'

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center"
    >
      <div className="flex flex-col items-center gap-6 rounded-[20px] bg-[var(--surface)] p-10">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg)]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--text-secondary)]"
            aria-hidden="true"
          >
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-[var(--text)]">
            You&apos;re offline
          </h1>
          <p className="max-w-sm text-[var(--text-secondary)]">
            Lumina needs an internet connection to load new content. Previously
            visited pages may still be available.
          </p>
        </div>
        <button
          onClick={handleRetry}
          className="rounded-lg bg-[var(--accent)] px-6 py-2.5 font-medium text-white transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
        >
          Try Again
        </button>
      </div>
    </m.div>
  )
}
