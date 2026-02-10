import { test, expect } from '@playwright/test'
import { navigateTo } from './helpers/navigation'

test.describe('Smoke Test', () => {
  test('loads the homepage and has the correct title', async ({ page }) => {
    await navigateTo(page, '/')
    await expect(page).toHaveTitle('Lumina')
  })
})
