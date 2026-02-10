import { test, expect } from './helpers/fixtures'
import { navigateTo } from './helpers/navigation'
import { SEED_TASKS } from './helpers/fixtures'

test.describe('Task Creation and List Flow', () => {
  test('creates a new task and verifies it appears in the list', async ({ page }) => {
    await navigateTo(page, '/')

    // Wait for the task list to load (seeded tasks should be visible)
    await expect(page.getByTestId('task-list')).toBeVisible()
    await expect(page.getByText(SEED_TASKS[0].text)).toBeVisible()

    // Fill in a new task
    const taskName = 'Write unit tests for auth module'
    await page.getByTestId('add-task-input').fill(taskName)

    // Select High priority (red)
    await page.getByRole('button', { name: 'High priority' }).click()

    // Submit the form
    await page.getByTestId('add-task-submit').click()

    // Assert the new task appears in the list (optimistic UI, should appear immediately)
    const newTaskItem = page.getByTestId('task-item').filter({ hasText: taskName })
    await expect(newTaskItem).toBeVisible()

    // Assert the priority dot shows red (High = priority 3 = bg-red-400)
    const priorityDot = newTaskItem.getByTestId('task-priority-dot')
    await expect(priorityDot).toHaveClass(/bg-red-400/)
  })

  test('verifies correct priority indicators for seeded tasks', async ({ page }) => {
    await navigateTo(page, '/')

    // Wait for the task list to load
    await expect(page.getByTestId('task-list')).toBeVisible()

    // "Buy groceries" is priority 1 (Low) — should have green dot
    const groceriesTask = page.getByTestId('task-item').filter({ hasText: 'Buy groceries' })
    await expect(groceriesTask).toBeVisible()
    const greenDot = groceriesTask.getByTestId('task-priority-dot')
    await expect(greenDot).toHaveClass(/bg-green-400/)

    // "Review pull request" is priority 3 (High) — should have red dot
    const reviewTask = page.getByTestId('task-item').filter({ hasText: 'Review pull request' })
    await expect(reviewTask).toBeVisible()
    const redDot = reviewTask.getByTestId('task-priority-dot')
    await expect(redDot).toHaveClass(/bg-red-400/)
  })

  test('creates a medium priority task and verifies yellow dot', async ({ page }) => {
    await navigateTo(page, '/')

    await expect(page.getByTestId('task-list')).toBeVisible()

    const taskName = 'Prepare meeting agenda'
    await page.getByTestId('add-task-input').fill(taskName)

    // Select Medium priority (yellow)
    await page.getByRole('button', { name: 'Medium priority' }).click()

    await page.getByTestId('add-task-submit').click()

    const newTaskItem = page.getByTestId('task-item').filter({ hasText: taskName })
    await expect(newTaskItem).toBeVisible()

    // Assert the priority dot shows yellow (Medium = priority 2 = bg-yellow-400)
    const priorityDot = newTaskItem.getByTestId('task-priority-dot')
    await expect(priorityDot).toHaveClass(/bg-yellow-400/)
  })

  test('toggles a task to done and verifies visual completion', async ({ page }) => {
    await navigateTo(page, '/')

    // Wait for the task list to load
    await expect(page.getByTestId('task-list')).toBeVisible()

    // Find the "Buy groceries" seeded task
    const taskItem = page.getByTestId('task-item').filter({ hasText: 'Buy groceries' })
    await expect(taskItem).toBeVisible()

    // Verify it starts as incomplete (checkbox should say "Mark as complete")
    const checkbox = taskItem.getByTestId('task-checkbox')
    await expect(checkbox).toHaveAttribute('aria-label', 'Mark as complete')

    // The task text should not have line-through initially
    const taskText = taskItem.locator('span.line-through')
    await expect(taskText).toHaveCount(0)

    // Toggle the task to done
    await checkbox.click()

    // After toggling, verify the visual completion:
    // 1. The checkbox aria-label changes to "Mark as incomplete"
    await expect(checkbox).toHaveAttribute('aria-label', 'Mark as incomplete')

    // 2. The task text should have line-through styling
    const completedText = taskItem.locator('span.line-through')
    await expect(completedText).toBeVisible()
    await expect(completedText).toContainText('Buy groceries')
  })
})
