import { test, expect, Page } from '@playwright/test';

// Helper: Login as test user
async function login(page: Page) {
  await page.goto('/auth/signin');
  await page.fill('#email', 'user@example.com');
  await page.fill('#password', 'user123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

test.describe('Project Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should create a new project', async ({ page }) => {
    // Navigate to projects page (click Projects in sidebar)
    await page.click('text=Projects');

    // Click create project button (actual button text is "새 프로젝트")
    await page.click('button:has-text("새 프로젝트")');
    
    // Wait for dialog to be visible
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('프로젝트 생성')).toBeVisible();
    
    // Fill project form (inputs are identified by preceding Label, not by name attribute)
    const dialog = page.getByRole('dialog');
    await dialog.locator('label:has-text("이름")').locator('~ input').fill('Test Project E2E');
    await dialog.locator('label:has-text("설명")').locator('~ input').fill('E2E test project description');
    await dialog.locator('label:has-text("예산")').locator('~ input').fill('100000');
    
    // Submit form (button text is "생성")
    await dialog.locator('button:has-text("생성")').click();
    
    // Should see success message or new project in list
    await expect(page.getByText('Test Project E2E').first()).toBeVisible({ timeout: 10000 });
  });

  test('should view project details', async ({ page }) => {
    await page.goto('/dashboard/projects');
    
    // Wait for projects to load
    await page.waitForLoadState('domcontentloaded');
    
    // Find first "보기" button and click it
    const viewButton = page.locator('button:has-text("보기")').first();
    await expect(viewButton).toBeVisible({ timeout: 5000 });
    await viewButton.click();
    
    // Should navigate to project detail page
    await expect(page).toHaveURL(/\/dashboard\/projects\/[a-z0-9-]+/, { timeout: 10000 });
    
    // Should see project sections (use .first() for strict mode)
    await expect(page.getByText(/멤버/i).first()).toBeVisible();
    await expect(page.getByText(/태스크/i).first()).toBeVisible();
    await expect(page.getByText(/마일스톤/i).first()).toBeVisible();
  });
});
