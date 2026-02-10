import { describe, test, expect, afterEach } from 'bun:test'
import '../helpers/component-setup'

import { render, screen, cleanup } from '@testing-library/react'
import { NoteCard } from '@/components/notes/NoteCard'

afterEach(cleanup)

// --- Helpers ---

const BASE_PROPS = {
  id: 'note-1',
  title: 'My Test Note',
  content: 'This is some content for testing.',
  tags: ['typescript', 'react'],
  updatedAt: Date.now(),
}

describe('NoteCard', () => {
  test('renders note title', () => {
    render(<NoteCard {...BASE_PROPS} />)
    expect(screen.getByText('My Test Note')).toBeTruthy()
  })

  test('renders content preview', () => {
    render(<NoteCard {...BASE_PROPS} />)
    expect(screen.getByText('This is some content for testing.')).toBeTruthy()
  })

  test('renders tags with # prefix', () => {
    render(<NoteCard {...BASE_PROPS} />)
    expect(screen.getByText('#typescript')).toBeTruthy()
    expect(screen.getByText('#react')).toBeTruthy()
  })

  test('links to the note detail page', () => {
    render(<NoteCard {...BASE_PROPS} />)
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/notes/note-1')
  })

  test('truncates content preview at 100 characters', () => {
    const longContent = 'A'.repeat(150)
    render(<NoteCard {...BASE_PROPS} content={longContent} />)
    const preview = screen.getByText(/A{50,}\.\.\./)
    expect(preview).toBeTruthy()
  })

  test('shows up to 4 tags and overflow count', () => {
    const tags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']
    render(<NoteCard {...BASE_PROPS} tags={tags} />)
    expect(screen.getByText('#tag1')).toBeTruthy()
    expect(screen.getByText('#tag2')).toBeTruthy()
    expect(screen.getByText('#tag3')).toBeTruthy()
    expect(screen.getByText('#tag4')).toBeTruthy()
    // +1 for the overflow
    expect(screen.getByText('+1')).toBeTruthy()
  })

  test('shows no tags section when tags array is empty', () => {
    const { container } = render(<NoteCard {...BASE_PROPS} tags={[]} />)
    const tagBadges = container.querySelectorAll('span.inline-flex')
    expect(tagBadges.length).toBe(0)
  })

  test('renders no preview when content is null', () => {
    const { container } = render(<NoteCard {...BASE_PROPS} content={null} />)
    expect(screen.getByText('My Test Note')).toBeTruthy()
    // No text-sm paragraph (preview)
    const previews = container.querySelectorAll('p.text-sm')
    expect(previews.length).toBe(0)
  })

  test('strips markdown from content preview', () => {
    render(
      <NoteCard
        {...BASE_PROPS}
        content="## Hello **World** and `code` here"
      />
    )
    expect(screen.getByText('Hello World and code here')).toBeTruthy()
  })

  test('renders formatted date — yesterday', () => {
    const yesterday = Date.now() - 24 * 60 * 60 * 1000
    render(<NoteCard {...BASE_PROPS} updatedAt={yesterday} />)
    expect(screen.getByText('Yesterday')).toBeTruthy()
  })
})
