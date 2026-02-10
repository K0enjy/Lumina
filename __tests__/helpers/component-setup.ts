/**
 * Setup file for component tests using happy-dom and @testing-library/react.
 *
 * Provides common mocks for Next.js, Framer Motion, and other external deps
 * so that client components can be rendered in Bun's test runner.
 */
import { mock } from 'bun:test'

// --- Mock next/link as a plain <a> element ---
mock.module('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    href: string
    children: React.ReactNode
    className?: string
  }) => {
    const React = require('react')
    return React.createElement('a', { href, className }, children)
  },
}))

// --- Mock next/navigation ---
const mockPush = mock(() => {})
const mockRouter = { push: mockPush, back: mock(() => {}), forward: mock(() => {}), refresh: mock(() => {}), replace: mock(() => {}), prefetch: mock(() => {}) }

mock.module('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// --- Mock motion/react (Framer Motion) ---
// Replace motion components with plain HTML equivalents
mock.module('motion/react', () => {
  const React = require('react')

  function createMotionProxy() {
    return new Proxy(
      {},
      {
        get: (_target: Record<string, unknown>, prop: string) => {
          return React.forwardRef(
            (
              {
                initial: _initial,
                animate: _animate,
                exit: _exit,
                transition: _transition,
                whileHover: _whileHover,
                layout: _layout,
                ...rest
              }: Record<string, unknown>,
              ref: React.Ref<HTMLElement>
            ) => React.createElement(prop, { ...rest, ref })
          )
        },
      }
    )
  }

  return {
    motion: createMotionProxy(),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  }
})

export { mockPush, mockRouter }
