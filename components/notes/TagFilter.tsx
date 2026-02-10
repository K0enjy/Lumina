'use client'

import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'

type TagFilterProps = {
  tags: string[]
  selectedTags: string[]
  onToggleTag: (tag: string) => void
  onClear: () => void
}

function TagFilter({ tags, selectedTags, onToggleTag, onClear }: TagFilterProps) {
  if (tags.length === 0) return null

  return (
    <motion.div layout className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => {
        const isSelected = selectedTags.includes(tag)
        return (
          <motion.button
            key={tag}
            layout
            onClick={() => onToggleTag(tag)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200',
              isSelected
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20'
            )}
          >
            #{tag}
          </motion.button>
        )
      })}

      <AnimatePresence>
        {selectedTags.length > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={onClear}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors duration-200"
          >
            Clear
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export { TagFilter }
export type { TagFilterProps }
