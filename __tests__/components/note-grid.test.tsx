import { describe, test, expect, afterEach } from 'bun:test'
import '../helpers/component-setup'

import { render, screen, cleanup } from '@testing-library/react'
import { NoteGrid } from '@/components/notes/NoteGrid'

afterEach(cleanup)

function makeNote(overrides: Record<string, unknown> = {}) {
  return {
    id: 'note-1',
    title: 'Test Note',
    content: 'Some content',
    tags: '["react","typescript"]',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  }
}

describe('NoteGrid', () => {
  test('renders empty state when no notes', () => {
    render(<NoteGrid notes={[]} />)
    expect(screen.getByText('No notes yet')).toBeTruthy()
    expect(screen.getByText('Create your first note to get started')).toBeTruthy()
  })

  test('renders note cards for each note', () => {
    const notes = [
      makeNote({ id: 'n1', title: 'First Note' }),
      makeNote({ id: 'n2', title: 'Second Note' }),
    ]
    render(<NoteGrid notes={notes} />)
    expect(screen.getByText('First Note')).toBeTruthy()
    expect(screen.getByText('Second Note')).toBeTruthy()
  })

  test('parses JSON tags from note data', () => {
    const notes = [makeNote({ tags: '["design","ux"]' })]
    render(<NoteGrid notes={notes} />)
    expect(screen.getByText('#design')).toBeTruthy()
    expect(screen.getByText('#ux')).toBeTruthy()
  })

  test('handles null tags gracefully', () => {
    const notes = [makeNote({ tags: null })]
    render(<NoteGrid notes={notes} />)
    expect(screen.getByText('Test Note')).toBeTruthy()
  })

  test('handles invalid JSON tags gracefully', () => {
    const notes = [makeNote({ tags: 'not-json' })]
    render(<NoteGrid notes={notes} />)
    expect(screen.getByText('Test Note')).toBeTruthy()
  })

  test('renders grid layout with 3 columns on desktop', () => {
    const notes = [makeNote()]
    const { container } = render(<NoteGrid notes={notes} />)
    const grid = container.querySelector('.grid')
    expect(grid).toBeTruthy()
    expect(grid?.className).toContain('lg:grid-cols-3')
  })
})
