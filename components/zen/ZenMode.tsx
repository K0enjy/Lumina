'use client'

import { motion, AnimatePresence } from 'motion/react'
import dynamic from 'next/dynamic'
import { useZenMode } from '@/components/zen/ZenModeContext'

const AudioPlayer = dynamic(() => import('@/components/zen/AudioPlayer'), {
  ssr: false,
})

function ZenExitButton({ onExit }: { onExit: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onExit}
      className="fixed top-4 right-4 z-50 flex items-center gap-1.5 rounded-lg bg-[var(--surface)]/80 backdrop-blur-sm px-3 py-1.5 text-sm text-[var(--text-secondary)] shadow-lg hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
      aria-label="Exit Zen Mode"
    >
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
        <path d="M18 6L6 18" />
        <path d="M6 6l12 12" />
      </svg>
      Exit Zen
    </motion.button>
  )
}

export function ZenMode() {
  const { isZen, exitZen } = useZenMode()

  return (
    <AnimatePresence>
      {isZen && (
        <>
          <motion.div
            key="zen-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-10 bg-[var(--bg)]/80 backdrop-blur-sm"
          />
          <ZenExitButton key="zen-exit" onExit={exitZen} />
          <AudioPlayer key="zen-audio" />
        </>
      )}
    </AnimatePresence>
  )
}
