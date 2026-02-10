import { test, expect } from './helpers/fixtures'
import { navigateTo } from './helpers/navigation'
import { SEED_NOTES, SEED_TASKS } from './helpers/fixtures'

test.describe('Command Palette Search Flow', () => {
  test('opens the command palette with Ctrl+K and verifies it is visible', async ({ page }) => {
    await navigateTo(page, '/')

    // Command palette should not be visible initially
    await expect(page.getByTestId('command-palette')).not.toBeVisible()

    // Open command palette with Ctrl+K
    await page.keyboard.press('Control+k')

    // Command palette should now be visible
    await expect(page.getByTestId('command-palette')).toBeVisible()

    // The search input should be visible and focused (component has a small delay before focusing)
    const input = page.getByTestId('command-palette-input')
    await expect(input).toBeVisible()
    await expect(input).toBeFocused({ timeout: 5000 })
  })

  test('searches for a note title and selects a result to navigate to the note page', async ({ page }) => {
    await navigateTo(page, '/')

    // Open command palette
    await page.keyboard.press('Control+k')
    await expect(page.getByTestId('command-palette')).toBeVisible()

    // Type a search query matching a seeded note title
    const input = page.getByTestId('command-palette-input')
    await input.fill('Meeting Notes')

    // Wait for search results to appear (debounce is 200ms)
    await expect(page.getByTestId('search-result-item').first()).toBeVisible({ timeout: 5000 })

    // Verify the search results contain the expected note
    const noteResult = page.getByTestId('search-result-item').filter({ hasText: 'Meeting Notes' }).filter({ hasText: 'Note' })
    await expect(noteResult).toBeVisible()

    // Click the note result to navigate
    await noteResult.click()

    // Verify navigation to the correct note page
    await page.waitForURL(/\/notes\/[a-f0-9-]+/)
    await expect(page).toHaveURL(/\/notes\/[a-f0-9-]+/)
  })

  test('searches for a task title and verifies it appears in results', async ({ page }) => {
    await navigateTo(page, '/')

    // Open command palette
    await page.keyboard.press('Control+k')
    await expect(page.getByTestId('command-palette')).toBeVisible()

    // Type a search query matching a seeded task title
    const input = page.getByTestId('command-palette-input')
    await input.fill('Buy groceries')

    // Wait for search results to appear
    await expect(page.getByTestId('search-result-item').first()).toBeVisible({ timeout: 5000 })

    // Verify the task appears in the results
    const results = page.getByTestId('search-result-item')
    await expect(results.filter({ hasText: 'Buy groceries' })).toBeVisible()

    // Verify it's labeled as a Task
    await expect(results.filter({ hasText: 'Buy groceries' })).toContainText('Task')
  })

  test('shows empty state when no results match the query', async ({ page }) => {
    await navigateTo(page, '/')

    // Open command palette
    await page.keyboard.press('Control+k')
    await expect(page.getByTestId('command-palette')).toBeVisible()

    // Type a search query that should not match anything
    const input = page.getByTestId('command-palette-input')
    await input.fill('xyznonexistentquery123')

    // Wait for search to complete and verify empty state appears
    await expect(page.getByTestId('search-empty-state')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('search-empty-state')).toContainText('No results found')

    // Verify no result items are shown
    await expect(page.getByTestId('search-result-item')).toHaveCount(0)
  })

  test('closes the command palette with Escape key', async ({ page }) => {
    await navigateTo(page, '/')

    // Open command palette
    await page.keyboard.press('Control+k')
    await expect(page.getByTestId('command-palette')).toBeVisible()

    // Wait for the input to be focused (component has 50ms delay for focus)
    const input = page.getByTestId('command-palette-input')
    await expect(input).toBeFocused()

    // Press Escape to close — keydown on the focused input bubbles to the dialog's onKeyDown handler
    await input.press('Escape')

    // Command palette should no longer be visible (wait for exit animation)
    await expect(page.getByTestId('command-palette')).not.toBeVisible({ timeout: 5000 })
  })

  test('navigates to a note result using keyboard (ArrowDown + Enter)', async ({ page }) => {
    await navigateTo(page, '/')

    // Open command palette
    await page.keyboard.press('Control+k')
    await expect(page.getByTestId('command-palette')).toBeVisible()

    // Search for a note
    const input = page.getByTestId('command-palette-input')
    await input.fill('Recipe Ideas')

    // Wait for results
    await expect(page.getByTestId('search-result-item').first()).toBeVisible({ timeout: 5000 })

    // Verify Recipe Ideas appears in results
    await expect(page.getByTestId('search-result-item').filter({ hasText: 'Recipe Ideas' })).toBeVisible()

    // Use keyboard to navigate and select
    // Find which index the Recipe Ideas result is at, then ArrowDown to it
    const resultCount = await page.getByTestId('search-result-item').count()
    for (let i = 0; i < resultCount; i++) {
      const resultText = await page.getByTestId('search-result-item').nth(i).textContent()
      if (resultText?.includes('Recipe Ideas')) {
        // Navigate down to this index (first result is already selected at index 0)
        for (let j = 0; j < i; j++) {
          await page.keyboard.press('ArrowDown')
        }
        break
      }
    }
    await page.keyboard.press('Enter')

    // Verify navigation to the correct note page
    await page.waitForURL(/\/notes\/[a-f0-9-]+/)
    await expect(page).toHaveURL(/\/notes\/[a-f0-9-]+/)
  })
})
