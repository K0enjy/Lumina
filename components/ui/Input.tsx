import { forwardRef, useId, type ComponentPropsWithRef } from 'react'
import { cn } from '@/lib/utils'

type InputProps = ComponentPropsWithRef<'input'> & {
  label?: string
}

const inputStyles =
  'w-full bg-[var(--surface)] text-[var(--text)] rounded-lg px-4 py-2.5 border border-[var(--border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:border-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] transition-all placeholder:text-[var(--text-secondary)]/60'

const labelStyles = 'block text-sm font-medium text-[var(--text)] mb-1.5'

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className, id, ...props }, ref) => {
    const autoId = useId()
    const inputId = id ?? autoId

    return (
      <div>
        {label && (
          <label htmlFor={inputId} className={labelStyles}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
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
