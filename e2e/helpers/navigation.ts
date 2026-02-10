import type { Page } from '@playwright/test'

export async function navigateTo(page: Page, path: string) {
  await page.goto(path)
  await waitForHydration(page)
}

export async function waitForHydration(page: Page) {
  await page.waitForLoadState('networkidle')
}
