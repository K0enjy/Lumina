import { test, expect } from './helpers/fixtures'
import { navigateTo } from './helpers/navigation'
import { SEED_NOTES } from './helpers/fixtures'

test.describe('Note Creation and Editing Flow', () => {
  test('creates a new note and lands on the editor page', async ({ page }) => {
    await navigateTo(page, '/notes')

    // Wait for notes page to load with seeded notes
    await expect(page.getByTestId('note-card').first()).toBeVisible()

    // Click "New Note" button
    await page.getByTestId('new-note-button').click()

    // Should navigate to /notes/[uuid] editor page
    await page.waitForURL(/\/notes\/[a-f0-9-]+/)

    // Wait for the lazy-loaded Tiptap editor to appear
    const editor = page.locator('[contenteditable="true"]')
    await editor.waitFor({ state: 'visible', timeout: 10000 })

    // The note editor wrapper should be visible
    await expect(page.getByTestId('note-editor')).toBeVisible()

    // The title input should default to "Untitled"
    const titleInput = page.getByTestId('note-title-input')
    await expect(titleInput).toHaveValue('Untitled')
  })

  test('creates a note, edits title and content, verifies persistence on /notes', async ({ page }) => {
    await navigateTo(page, '/notes')

    // Wait for notes page to load
    await expect(page.getByTestId('note-card').first()).toBeVisible()

    // Count existing note cards before creating
    const initialCount = await page.getByTestId('note-card').count()

    // Click "New Note" button
    await page.getByTestId('new-note-button').click()

    // Wait for editor page
    await page.waitForURL(/\/notes\/[a-f0-9-]+/)

    // Wait for the lazy-loaded Tiptap editor
    const editor = page.locator('[contenteditable="true"]')
    await editor.waitFor({ state: 'visible', timeout: 10000 })

    // Edit the title
    const titleInput = page.getByTestId('note-title-input')
    await titleInput.clear()
    await titleInput.fill('My Test Note')

    // Type content into the Tiptap editor
    await editor.click()
    await page.keyboard.type('This is test content for the note')

    // Wait for auto-save to complete (debounce is 1000ms, give extra buffer)
    await page.waitForTimeout(2000)

    // Navigate back to /notes
    await navigateTo(page, '/notes')

    // Verify the new note card shows the updated title
    const newNoteCard = page.getByTestId('note-card').filter({ hasText: 'My Test Note' })
    await expect(newNoteCard).toBeVisible()

    // Verify the content preview is shown
    await expect(newNoteCard).toContainText('This is test content for the note')

    // Verify there's one more note card than before
    await expect(page.getByTestId('note-card')).toHaveCount(initialCount + 1)
  })

  test('edits an existing seeded note and confirms changes persist', async ({ page }) => {
    await navigateTo(page, '/notes')

    // Wait for notes page to load
    await expect(page.getByTestId('note-card').first()).toBeVisible()

    // Click on the "Meeting Notes" seeded note card
    const meetingNoteCard = page.getByTestId('note-card').filter({ hasText: SEED_NOTES[0].title })
    await expect(meetingNoteCard).toBeVisible()
    await meetingNoteCard.click()

    // Wait for the editor page to load
    await page.waitForURL(/\/notes\/[a-f0-9-]+/)

    // Wait for the lazy-loaded Tiptap editor
    const editor = page.locator('[contenteditable="true"]')
    await editor.waitFor({ state: 'visible', timeout: 10000 })

    // Verify the title shows the seeded note's title
    const titleInput = page.getByTestId('note-title-input')
    await expect(titleInput).toHaveValue(SEED_NOTES[0].title)

    // Update the title
    await titleInput.clear()
    await titleInput.fill('Updated Meeting Notes')

    // Add more content to the editor
    await editor.click()
    // Move to the end of existing content
    await page.keyboard.press('End')
    await page.keyboard.press('Enter')
    await page.keyboard.type('Added new discussion points')

    // Wait for auto-save to complete
    await page.waitForTimeout(2000)

    // Navigate back to /notes
    await navigateTo(page, '/notes')

    // Verify the updated title appears on the note card
    const updatedCard = page.getByTestId('note-card').filter({ hasText: 'Updated Meeting Notes' })
    await expect(updatedCard).toBeVisible()

    // Verify the new content preview includes the added text
    await expect(updatedCard).toContainText('Added new discussion points')

    // The old title should no longer appear
    await expect(page.getByTestId('note-card').filter({ hasText: 'Meeting Notes' }).filter({ hasNotText: 'Updated' })).toHaveCount(0)
  })
})
