import { describe, test, expect, afterEach } from 'bun:test'
import '../../helpers/component-setup'

import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NoteCard } from '@/components/notes/NoteCard'

afterEach(cleanup)

function makeNote(overrides: Partial<Parameters<typeof NoteCard>[0]> = {}) {
  return {
    id: 'note-abc-123',
    title: 'Meeting Notes',
    content: 'Some plain text content for testing.',
    tags: ['work', 'meeting'],
    updatedAt: Date.now(),
    ...overrides,
  }
}

describe('NoteCard title display', () => {
  test('renders the note title visibly', () => {
    render(<NoteCard {...makeNote()} />)
    expect(screen.getByText('Meeting Notes')).toBeTruthy()
  })

  test('renders title inside an h3 element', () => {
    render(<NoteCard {...makeNote()} />)
    const heading = screen.getByText('Meeting Notes')
    expect(heading.tagName).toBe('H3')
  })

  test('renders a different title when provided', () => {
    render(<NoteCard {...makeNote({ title: 'Architecture Decision' })} />)
    expect(screen.getByText('Architecture Decision')).toBeTruthy()
  })
})

describe('NoteCard content preview', () => {
  test('renders content preview text', () => {
    render(<NoteCard {...makeNote()} />)
    expect(screen.getByText('Some plain text content for testing.')).toBeTruthy()
  })

  test('truncates content longer than 100 characters with ellipsis', () => {
    const longContent = 'This is a very long note content that keeps going and going. ' +
      'It contains so much text that it absolutely must be truncated at some point to fit.'
    render(<NoteCard {...makeNote({ content: longContent })} />)

    const preview = screen.getByText(/\.\.\.$/);
    expect(preview).toBeTruthy()
    // The preview should be at most 103 chars (100 + "...")
    expect(preview.textContent!.length).toBeLessThanOrEqual(103)
  })

  test('does not truncate content that is exactly 100 characters', () => {
    const exact100 = 'A'.repeat(100)
    render(<NoteCard {...makeNote({ content: exact100 })} />)
    expect(screen.getByText(exact100)).toBeTruthy()
  })

  test('renders no preview paragraph when content is null', () => {
    const { container } = render(<NoteCard {...makeNote({ content: null })} />)
    const previews = container.querySelectorAll('p.text-sm')
    expect(previews.length).toBe(0)
  })

  test('renders no preview paragraph when content is empty string', () => {
    const { container } = render(<NoteCard {...makeNote({ content: '' })} />)
    const previews = container.querySelectorAll('p.text-sm')
    expect(previews.length).toBe(0)
  })

  test('strips markdown formatting from content preview', () => {
    render(
      <NoteCard
        {...makeNote({ content: '## Heading\n**bold text** and `inline code`' })}
      />
    )
    expect(screen.getByText('Heading bold text and inline code')).toBeTruthy()
  })
})

describe('NoteCard tags as badges', () => {
  test('renders tags with # prefix as badge components', () => {
    render(<NoteCard {...makeNote({ tags: ['typescript', 'react'] })} />)
    expect(screen.getByText('#typescript')).toBeTruthy()
    expect(screen.getByText('#react')).toBeTruthy()
  })

  test('renders multiple tags correctly', () => {
    const tags = ['frontend', 'backend', 'devops']
    render(<NoteCard {...makeNote({ tags })} />)
    expect(screen.getByText('#frontend')).toBeTruthy()
    expect(screen.getByText('#backend')).toBeTruthy()
    expect(screen.getByText('#devops')).toBeTruthy()
  })

  test('renders tags inside badge elements with correct styling', () => {
    const { container } = render(
      <NoteCard {...makeNote({ tags: ['design'] })} />
    )
    const badge = container.querySelector('span.inline-flex')
    expect(badge).not.toBeNull()
    expect(badge!.textContent).toBe('#design')
  })

  test('shows at most 4 tags and displays overflow count', () => {
    const tags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6']
    render(<NoteCard {...makeNote({ tags })} />)
    expect(screen.getByText('#tag1')).toBeTruthy()
    expect(screen.getByText('#tag2')).toBeTruthy()
    expect(screen.getByText('#tag3')).toBeTruthy()
    expect(screen.getByText('#tag4')).toBeTruthy()
    expect(screen.queryByText('#tag5')).toBeNull()
    expect(screen.queryByText('#tag6')).toBeNull()
    expect(screen.getByText('+2')).toBeTruthy()
  })

  test('shows exactly 4 tags without overflow indicator', () => {
    const tags = ['a', 'b', 'c', 'd']
    render(<NoteCard {...makeNote({ tags })} />)
    expect(screen.getByText('#a')).toBeTruthy()
    expect(screen.getByText('#d')).toBeTruthy()
    expect(screen.queryByText(/^\+\d+$/)).toBeNull()
  })
})

describe('NoteCard with no tags', () => {
  test('renders gracefully without a tags section when tags array is empty', () => {
    const { container } = render(<NoteCard {...makeNote({ tags: [] })} />)
    const tagBadges = container.querySelectorAll('span.inline-flex')
    expect(tagBadges.length).toBe(0)
  })

  test('still renders title and content when no tags are present', () => {
    render(<NoteCard {...makeNote({ tags: [] })} />)
    expect(screen.getByText('Meeting Notes')).toBeTruthy()
    expect(screen.getByText('Some plain text content for testing.')).toBeTruthy()
  })
})

describe('NoteCard link and navigation', () => {
  test('wraps card in a link to /notes/{id}', () => {
    render(<NoteCard {...makeNote({ id: 'note-xyz-789' })} />)
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/notes/note-xyz-789')
  })

  test('link is clickable', async () => {
    const user = userEvent.setup()
    render(<NoteCard {...makeNote()} />)
    const link = screen.getByRole('link')
    // Verify the link element exists and can be clicked without throwing
    await user.click(link)
    expect(link).toBeTruthy()
  })
})

describe('NoteCard updatedAt timestamp', () => {
  test('renders "Yesterday" for a timestamp from one day ago', () => {
    const yesterday = Date.now() - 24 * 60 * 60 * 1000
    render(<NoteCard {...makeNote({ updatedAt: yesterday })} />)
    expect(screen.getByText('Yesterday')).toBeTruthy()
  })

  test('renders "X days ago" for timestamps within the last week', () => {
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000
    render(<NoteCard {...makeNote({ updatedAt: threeDaysAgo })} />)
    expect(screen.getByText('3 days ago')).toBeTruthy()
  })

  test('renders a formatted date for timestamps older than a week', () => {
    // Use a fixed date far in the past
    const oldDate = new Date('2025-01-15T12:00:00Z').getTime()
    render(<NoteCard {...makeNote({ updatedAt: oldDate })} />)
    expect(screen.getByText('Jan 15')).toBeTruthy()
  })
})
