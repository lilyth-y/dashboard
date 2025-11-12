import { test, expect, Page } from '@playwright/test'

async function login(page: Page) {
  await page.goto('/auth/signin')
  await page.fill('#email', 'user@example.com')
  await page.fill('#password', 'user123!')
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
}

test.describe('Accessibility smoke', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('transactions dialog has title and is visible to screen readers', async ({ page }) => {
    await page.goto('/dashboard/finance/transactions')
    await page.waitForLoadState('domcontentloaded')

    await page.getByRole('button', { name: '거래 추가' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Dialog should contain a heading (DialogTitle) announcing the purpose
    await expect(dialog.getByRole('heading')).toBeVisible()

  // Basic fields should be discoverable; inputs are label-associated, Select uses visible text
  await expect(dialog.getByLabel('금액 *')).toBeVisible()
  await expect(dialog.getByText('카테고리 *')).toBeVisible()
  await expect(dialog.getByLabel('날짜 *')).toBeVisible()
  })
})
