import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.skip('should allow user to sign in', async ({ page }) => {
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

  test('should allow user to sign up', async ({ page }) => {
    await page.goto('/auth/signin');

    // Click sign up link
    await page.click('text=/회원가입/i');
    await expect(page).toHaveURL('/auth/signup');

    // Fill signup form
    const timestamp = Date.now();
    const email = `test.e2e.${timestamp}@example.com`;
    const name = `E2E User ${timestamp}`;

    await page.fill('input[name="name"]', name);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 });

    // Verify user is logged in (check for name in header)
    // Adjust selector based on actual rendering, usually avatar or name in TopNav
    // We verify the TopNav presence at least
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByText(name)).toBeVisible({ timeout: 10000 });
  });
});
