import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type BadgeProps = {
  className?: string
  'data-testid'?: string
} & (
  | { variant: 'dot'; priority: 1 | 2 | 3; children?: never }
  | { variant: 'tag'; priority?: never; children: ReactNode }
)

const priorityColors = {
  1: 'bg-green-400',
  2: 'bg-yellow-400',
  3: 'bg-red-400',
} as const

const priorityLabels = {
  1: 'Low priority',
  2: 'Medium priority',
  3: 'High priority',
} as const

function Badge({ className, 'data-testid': testId, ...props }: BadgeProps) {
  if (props.variant === 'dot') {
    return (
      <span
        className={cn(
          'inline-block w-2 h-2 rounded-full',
          priorityColors[props.priority],
          className
        )}
        role="img"
        aria-label={priorityLabels[props.priority]}
        data-testid={testId}
      />
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent',
        className
      )}
    >
      {props.children}
    </span>
  )
}

export { Badge }
export type { BadgeProps }
