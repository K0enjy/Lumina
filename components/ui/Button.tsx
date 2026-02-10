'use client'

import { forwardRef, type ComponentPropsWithRef } from 'react'
import { cn } from '@/lib/utils'

type ButtonProps = ComponentPropsWithRef<'button'> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const baseStyles =
  'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:opacity-50 disabled:pointer-events-none'

const variantStyles = {
  primary: 'bg-[var(--accent)] text-white hover:opacity-90 active:opacity-80',
  secondary:
    'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--accent)]/10',
  ghost: 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text)]',
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled}
        aria-disabled={disabled || undefined}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
export type { ButtonProps }
