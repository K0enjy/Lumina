'use client'

import { useRef } from 'react'
import { motion } from 'motion/react'

export default function Template({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex-1"
      style={{ willChange: 'transform, opacity' }}
      onAnimationComplete={() => {
        if (ref.current) {
          ref.current.style.willChange = 'auto'
        }
      }}
    >
      {children}
    </motion.div>
  )
}
