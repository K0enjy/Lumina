'use client'

import { type ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

type CardProps = {
  children: ReactNode
  className?: string
  hover?: boolean
}

const baseStyles =
  'bg-[var(--surface)] rounded-[20px] p-6 border border-[var(--text-secondary)]/10'

function Card({ children, className, hover = true }: CardProps) {
  if (hover) {
    return (
      <motion.div
        className={cn(baseStyles, className)}
        whileHover={{
          scale: 1.02,
          boxShadow:
            '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div className={cn(baseStyles, className)}>
      {children}
    </div>
  )
}

export { Card }
export type { CardProps }
