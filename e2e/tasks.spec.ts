import { test, expect, Page } from '@playwright/test';

// Helper: Login as test user
async function login(page: Page) {
  await page.goto('/auth/signin');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

test.describe('Task Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Navigate to a project
    await page.goto('/dashboard/projects');
    await page.click('text=/Test Project/i');
  });

  test('should create a new task', async ({ page }) => {
    // Click create task button
    await page.click('button:has-text("태스크 추가")');
    
    // Fill task form
    await page.fill('input[name="title"]', 'E2E Test Task');
    await page.fill('textarea[name="description"]', 'This is an E2E test task');
    
    // Select priority
    await page.click('text=/우선순위/i');
    await page.click('text=HIGH');
    
    // Submit form
    await page.click('button:has-text("저장")');
    
    // Should see new task in board
    await expect(page.getByText('E2E Test Task')).toBeVisible();
  });

  test('should move task between columns (drag and drop)', async ({ page }) => {
    const taskCard = page.getByText('E2E Test Task').first();
    await expect(taskCard).toBeVisible();
    
    // Get initial column (TODO)
    const todoColumn = page.locator('[data-status="TODO"]');
    const inProgressColumn = page.locator('[data-status="IN_PROGRESS"]');
    
    // Drag task to IN_PROGRESS column
    await taskCard.hover();
    await page.mouse.down();
    await inProgressColumn.hover();
    await page.mouse.up();
    
    // Task should now be in IN_PROGRESS
    const inProgressTasks = inProgressColumn.locator('text=E2E Test Task');
    await expect(inProgressTasks).toBeVisible();
  });

  test('should edit task details', async ({ page }) => {
    // Click on task card to open detail dialog
    await page.click('text=E2E Test Task');
    
    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Edit task title
    const titleInput = page.locator('input[name="title"]');
    await titleInput.clear();
    await titleInput.fill('Updated E2E Task');
    
    // Save changes (Enter key)
    await titleInput.press('Enter');
    
    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible();
    
    // Updated title should be visible
    await expect(page.getByText('Updated E2E Task')).toBeVisible();
  });

  test('should delete task', async ({ page }) => {
    // Click on task card
    await page.click('text=Updated E2E Task');
    
    // Click delete button in dialog
    await page.click('button:has-text("삭제")');
    
    // Confirm deletion
    await page.click('button:has-text("확인")');
    
    // Task should no longer be visible
    await expect(page.getByText('Updated E2E Task')).not.toBeVisible();
  });
});
