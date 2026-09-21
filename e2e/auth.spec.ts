import { test, expect } from '@playwright/test'

test.describe('Shorebird Console Authentication Flow', () => {
  test('redirects unauthenticated user to /login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/.*login/)
    await expect(page.locator('.card-title')).toContainText('Shorebird Console')
  })

  test('allows entering private token and logging in', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="password"]', 'sb_api_private_shorebird_token')
    await page.click('button.submit-btn')
    await expect(page).toHaveURL(/.*apps/)
    await expect(page.locator('.page-title')).toContainText('应用列表')
  })
})
