import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

type NoteCardProps = {
  id: string
  title: string
  content: string | null
  tags: string[]
  updatedAt: number
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function getPreview(content: string | null): string {
  if (!content) return ''
  const stripped = content.replace(/#[a-zA-Z0-9_-]+/g, '').replace(/[#*_~`>\[\]()-]/g, '').trim()
  return stripped.length > 100 ? stripped.slice(0, 100) + '...' : stripped
}

function NoteCard({ id, title, content, tags, updatedAt }: NoteCardProps) {
  return (
    <Link href={`/notes/${id}`} className="block">
      <Card className="h-full cursor-pointer">
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-semibold text-[var(--text)] line-clamp-1">
            {title}
          </h3>

          {content && getPreview(content) && (
            <p className="text-sm text-[var(--text-secondary)] line-clamp-3 leading-relaxed">
              {getPreview(content)}
            </p>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="tag">
                  #{tag}
                </Badge>
              ))}
              {tags.length > 4 && (
                <span className="text-xs text-[var(--text-secondary)] self-center">
                  +{tags.length - 4}
                </span>
              )}
            </div>
          )}

          <p className="text-xs text-[var(--text-secondary)] mt-auto">
            {formatDate(updatedAt)}
          </p>
        </div>
      </Card>
    </Link>
  )
}

export { NoteCard }
export type { NoteCardProps }
