import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should allow user to sign in', async ({ page }) => {
    await page.goto('/auth/signin');

    // Fill sign-in form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Should see welcome message or user profile
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.goto('/auth/signin');

    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.getByText(/유효한 이메일/i)).toBeVisible();
  });

  test('should navigate to sign up page', async ({ page }) => {
    await page.goto('/auth/signin');

    // Click sign up link
    await page.click('text=/회원가입/i');

    // Should navigate to sign up page
    await expect(page).toHaveURL('/auth/signup');
  });
});
