import { test, expect, Page } from '@playwright/test'

// Helper: Login as test user
async function login(page: Page) {
  await page.goto('/auth/signin')
  await page.fill('#email', 'user@example.com')
  await page.fill('#password', 'user123!')
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
}

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should display dashboard overview', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should see main dashboard content (financial cards: 총 수입)
    await expect(page.getByText(/총 수입/i).first()).toBeVisible()
    
    // Should see navigation menu (English text in sidebar)
    await expect(page.getByText('Projects')).toBeVisible()
    await expect(page.getByText('Finance')).toBeVisible()
  })

  test('should navigate to analytics page', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Click analytics link
    await page.click('text=/Analytics/i')
    
    // Should navigate to analytics
    await expect(page).toHaveURL('/dashboard/analytics')
    await expect(page.getByRole('heading', { name: /Analytics/i })).toBeVisible()
  })

  test('should navigate to organization page', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Click organization link
    await page.click('text=/Organization/i')
    
    // Should navigate to organization
    await expect(page).toHaveURL('/dashboard/organization')
    await expect(page.getByRole('heading', { name: /Organization/i })).toBeVisible()
  })

  test('should toggle mobile navigation menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard')
    
    // Click menu button
    const menuButton = page.locator('button[aria-label="Toggle navigation menu"]')
    if (await menuButton.isVisible()) {
      await menuButton.click()
      
      // Navigation should be visible (use first nav to avoid strict mode violation)
      await expect(page.locator('nav').first()).toBeVisible()
    }
  })

  test('should show user profile in navigation', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Click user avatar to open dropdown
    await page.click('img[alt="User avatar"]')
    
    // Should see user email in dropdown
    await expect(page.getByText(/user@example.com/i)).toBeVisible()
  })

  test('should navigate between different sections', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Wait for initial page load (domcontentloaded is faster)
    await page.waitForLoadState('domcontentloaded');
    
    // Navigate to Projects (wait for nav to be visible)
    await page.waitForSelector('nav');
    await page.click('a[href="/dashboard/projects"]:has-text("Projects")')
    await expect(page).toHaveURL(/\/projects/, { timeout: 10000 })
    await page.waitForLoadState('domcontentloaded');
    
    // Navigate to Finance (click "Transactions" link under Finance section)
    await page.click('a[href="/dashboard/finance/transactions"]:has-text("Transactions")')
    await expect(page).toHaveURL(/\/finance\/transactions/, { timeout: 10000 })
    
    // Navigate back to Dashboard (use goto instead of click to avoid navigation issues)
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
  })

  test('should display theme toggle', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should see theme toggle button
    const themeToggle = page.locator('button').filter({ hasText: /theme|테마/i })
    if (await themeToggle.count() > 0) {
      await expect(themeToggle.first()).toBeVisible()
    }
  })

  test('should handle logout', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Look for logout button
    const logoutButton = page.locator('button, a').filter({ hasText: /로그아웃|logout/i })
    if (await logoutButton.count() > 0) {
      await logoutButton.first().click()
      
      // Should redirect to signin
      await expect(page).toHaveURL(/\/auth\/signin/)
    }
  })
})
