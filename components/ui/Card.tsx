import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type CardProps = {
  children: ReactNode
  className?: string
}

const baseStyles =
  'bg-[var(--surface)] rounded-[20px] p-6 border border-[var(--text-secondary)]/10'

function Card({ children, className }: CardProps) {
  return (
    <div className={cn(baseStyles, className)}>
      {children}
    </div>
  )
}

export { Card, baseStyles }
export type { CardProps }
