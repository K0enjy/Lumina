'use client'

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
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => {
        const isSelected = selectedTags.includes(tag)
        return (
          <button
            key={tag}
            onClick={() => onToggleTag(tag)}
            className={cn(
              'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-200',
              isSelected
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20'
            )}
          >
            #{tag}
          </button>
        )
      })}

      {selectedTags.length > 0 && (
        <button
          onClick={onClear}
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-all duration-200"
        >
          Clear
        </button>
      )}
    </div>
  )
}

export { TagFilter }
export type { TagFilterProps }
