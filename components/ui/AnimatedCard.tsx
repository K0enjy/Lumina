'use client'

import { type ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { baseStyles } from '@/components/ui/Card'

type AnimatedCardProps = {
  children: ReactNode
  className?: string
}

function AnimatedCard({ children, className }: AnimatedCardProps) {
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

export { AnimatedCard }
export type { AnimatedCardProps }
