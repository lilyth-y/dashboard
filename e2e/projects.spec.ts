import { test, expect, Page } from '@playwright/test';

// Helper: Login as test user
async function login(page: Page) {
  await page.goto('/auth/signin');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

test.describe('Project Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should create a new project', async ({ page }) => {
    // Navigate to projects page
    await page.click('text=/프로젝트/i');
    
    // Click create project button
    await page.click('button:has-text("프로젝트 생성")');
    
    // Fill project form
    await page.fill('input[name="name"]', 'Test Project E2E');
    await page.fill('textarea[name="description"]', 'E2E test project description');
    await page.fill('input[name="budget"]', '100000');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should see success message or new project in list
    await expect(page.getByText('Test Project E2E')).toBeVisible();
  });

  test('should view project details', async ({ page }) => {
    await page.goto('/dashboard/projects');
    
    // Click on first project
    await page.click('text=/Test Project/i');
    
    // Should navigate to project detail page
    await expect(page).toHaveURL(/\/dashboard\/projects\/[a-z0-9-]+/);
    
    // Should see project sections
    await expect(page.getByText(/멤버/i)).toBeVisible();
    await expect(page.getByText(/태스크/i)).toBeVisible();
    await expect(page.getByText(/마일스톤/i)).toBeVisible();
  });
});
