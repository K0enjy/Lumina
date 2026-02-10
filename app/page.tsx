'use client'

import { Button, Card, Input, Badge, ThemeToggle } from '@/components/ui'

export default function DesignSystemShowcase() {
  return (
    <main className="min-h-screen bg-[var(--bg)] p-8">
      <div className="mx-auto max-w-4xl space-y-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[var(--text)]">
            Lumina Design System
          </h1>
          <ThemeToggle />
        </div>

        {/* Buttons */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--text)]">Buttons</h2>
          <div className="flex flex-wrap items-center gap-6">
            <div className="space-y-2">
              <p className="text-sm text-[var(--text-secondary)]">Primary</p>
              <div className="flex items-center gap-3">
                <Button variant="primary" size="sm">Small</Button>
                <Button variant="primary" size="md">Medium</Button>
                <Button variant="primary" size="lg">Large</Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-[var(--text-secondary)]">Secondary</p>
              <div className="flex items-center gap-3">
                <Button variant="secondary" size="sm">Small</Button>
                <Button variant="secondary" size="md">Medium</Button>
                <Button variant="secondary" size="lg">Large</Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-[var(--text-secondary)]">Ghost</p>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm">Small</Button>
                <Button variant="ghost" size="md">Medium</Button>
                <Button variant="ghost" size="lg">Large</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--text)]">Card</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Card>
              <h3 className="text-lg font-medium text-[var(--text)]">
                Hover me
              </h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                This card has hover animation with scale and shadow. Try hovering
                over it to see the effect.
              </p>
            </Card>
            <Card hover={false}>
              <h3 className="text-lg font-medium text-[var(--text)]">
                Static card
              </h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                This card has hover disabled for comparison.
              </p>
            </Card>
          </div>
        </section>

        {/* Inputs */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--text)]">Input</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Input label="With label" placeholder="Type something..." id="demo-label" />
            <Input placeholder="Without label" id="demo-no-label" />
          </div>
        </section>

        {/* Badges */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--text)]">Badge</h2>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--text-secondary)]">Priority dots:</span>
              <div className="flex items-center gap-2">
                <Badge variant="dot" priority={1} />
                <span className="text-xs text-[var(--text-secondary)]">Low</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="dot" priority={2} />
                <span className="text-xs text-[var(--text-secondary)]">Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="dot" priority={3} />
                <span className="text-xs text-[var(--text-secondary)]">High</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--text-secondary)]">Tag pills:</span>
              <Badge variant="tag">Feature</Badge>
              <Badge variant="tag">In Progress</Badge>
              <Badge variant="tag">v1.0</Badge>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
