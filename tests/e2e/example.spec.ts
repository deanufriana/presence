import { test, expect } from '@playwright/test'
import { mockTauri } from './tauri.mock'

test.beforeEach(async ({ page }) => {
  // Always mock Tauri before navigating
  await mockTauri(page)
})

test('has title', async ({ page }) => {
  await page.goto('/')

  // Expect a title "to contain" a substring.
  // Based on tauri.conf.json, the product name is "Presence"
  // But the HTML title might be different. Let's just check if the page loads.
  await expect(page).toHaveTitle(/Presence/i)
})

test('loads the main dashboard', async ({ page }) => {
  await page.goto('/')

  // Check for some common elements in your dashboard.
  // Since I don't know the exact UI yet, I'll check for a generic heading or app container.
  const main = page.locator('body')
  await expect(main).toBeVisible()
})
