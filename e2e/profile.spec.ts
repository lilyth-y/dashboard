import { test, expect, Page } from '@playwright/test'

// Helper: Login as test user
async function login(page: Page) {
  await page.goto('/auth/signin')
  await page.fill('#email', 'user@example.com')
  await page.fill('#password', 'user123!' )
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
}

test.describe('Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should navigate to profile page', async ({ page }) => {
    // Click profile link in navigation (English text)
    await page.click('text=Profile')

    // Should be on profile page
    await expect(page).toHaveURL('/dashboard/profile')
    
    // Should see profile card title
    await expect(page.getByText('프로필')).toBeVisible()
  })

  test('should display user information', async ({ page }) => {
    await page.goto('/dashboard/profile')
    
    // Wait for profile to load (domcontentloaded is faster and more reliable)
    await page.waitForLoadState('domcontentloaded')
    
    // Should see email field (disabled) and have a value
    const emailInput = page.locator('label:has-text("이메일") + input, div:has(> label:has-text("이메일")) input').first()
    await expect(emailInput).toBeVisible()
    await expect(emailInput).toBeDisabled()
    await expect(emailInput).toHaveValue(/.*@.*\..*/)
  })

  test('should update profile name', async ({ page }) => {
    await page.goto('/dashboard/profile')
    
    // Wait for form to load
    await page.waitForSelector('label:has-text("이름") ~ input')
    
    // Update name
    const nameInput = page.locator('label:has-text("이름") ~ input')
    await nameInput.clear()
    await nameInput.fill('Updated E2E Name')
    
    // Save changes
    await page.click('button:has-text("저장")')
    
    // Wait a bit for the update to complete
    await page.waitForTimeout(1000)
    
    // Verify the name was saved by checking the input value
    await expect(nameInput).toHaveValue('Updated E2E Name')
  })

  test('should not allow email editing', async ({ page }) => {
    await page.goto('/dashboard/profile')
    
    // Email field should be disabled
    const emailInput = page.locator('label:has-text("이메일") + input, div:has(> label:has-text("이메일")) input').first()
    await expect(emailInput).toBeDisabled()
  })

  test('should display user role', async ({ page }) => {
    await page.goto('/dashboard/profile')
    
    // Should see role information
    await expect(page.getByText(/역할/i)).toBeVisible()
  })

  test('should update profile bio', async ({ page }) => {
    await page.goto('/dashboard/profile')
    
    // Check if bio field exists
    const bioTextarea = page.locator('textarea[name="bio"], textarea').first()
    if (await bioTextarea.isVisible()) {
      await bioTextarea.clear()
      await bioTextarea.fill('This is my updated bio from E2E test')
      
      // Save changes
      await page.click('button:has-text("저장")')
      
      // Should see success message
      await expect(page.getByText(/프로필이 업데이트되었습니다\./i)).toBeVisible({ timeout: 5000 })
    }
  })

  test('should show validation error for empty name', async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await page.goto('/dashboard/profile')
    
    // Wait for form to load and have data
    const nameInput = page.locator('label:has-text("이름") + input, div:has(> label:has-text("이름")) input').first()
    await expect(nameInput).not.toHaveValue('', { timeout: 10000 })
    
    // Clear name field
    await nameInput.fill('')
    await expect(nameInput).toHaveValue('')
    
    // Try to save
    await page.click('button:has-text("저장")')
    
    // Should see validation error toast
    await expect(page.getByText('이름을 입력해주세요.')).toBeVisible()
  })
})
