import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should allow user to sign in', async ({ page }) => {
    await page.goto('/auth/signin');

    // Fill sign-in form
    await page.fill('#email', 'user@example.com');
    await page.fill('#password', 'user123!');
    
    // Submit form
    await page.click('button[type="submit"]');

    // Wait a bit for submission
    await page.waitForTimeout(2000);
    
    // Check if error message appeared
    const errorAlert = page.locator('[role="alert"]');
    if (await errorAlert.isVisible()) {
      console.log('Login error:', await errorAlert.textContent());
    }

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    
    // Should see financial dashboard content (총 수입 card - pick first one)
    await expect(page.getByText(/총 수입/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.goto('/auth/signin');

    await page.fill('#email', 'invalid-email');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    // Should stay on signin page (not redirect due to validation)
    await expect(page).toHaveURL('/auth/signin');
  });

  test('should navigate to sign up page', async ({ page }) => {
    await page.goto('/auth/signin');

    // Click sign up link
    await page.click('text=/회원가입/i');

    // Should navigate to sign up page
    await expect(page).toHaveURL('/auth/signup');
  });
});
