'use client'

import { forwardRef, type ComponentPropsWithRef } from 'react'
import { cn } from '@/lib/utils'

type InputProps = ComponentPropsWithRef<'input'> & {
  label?: string
}

const inputStyles =
  'w-full bg-[var(--surface)] text-[var(--text)] rounded-lg px-4 py-2.5 border border-[var(--text-secondary)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all placeholder:text-[var(--text-secondary)]/60'

const labelStyles = 'block text-sm font-medium text-[var(--text)] mb-1.5'

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className, id, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label htmlFor={id} className={labelStyles}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(inputStyles, className)}
          {...props}
        />
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
export type { InputProps }
