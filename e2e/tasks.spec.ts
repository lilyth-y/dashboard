import { test, expect, Page } from '@playwright/test';

// Helper: Login as test user
async function login(page: Page) {
  await page.goto('/auth/signin');
  await page.fill('#email', 'user@example.com');
  await page.fill('#password', 'user123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

test.describe('Task Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Navigate to a project (using seeded project name)
    await page.goto('/dashboard/projects');
    await page.waitForLoadState('domcontentloaded');
    
    // Click "보기" button for first project
    const viewButton = page.locator('button:has-text("보기")').first();
    await expect(viewButton).toBeVisible({ timeout: 5000 });
    await viewButton.click();
    
    // Wait for project page to load
    await page.waitForURL(/\/dashboard\/projects\/[a-z0-9-]+/);
    await page.waitForLoadState('domcontentloaded');
  });

  test('should create a new task', async ({ page }) => {
    // Wait for task section to load
    await page.waitForSelector('text=태스크');
    
    // Find the task creation form within the "태스크" card
    // Use the "추가" button as context to find the right form
    const taskCard = page.locator('text=태스크').locator('..').locator('..');
    
    // Fill task form fields (use first visible input after "제목" label in task card)
    await taskCard.locator('label:has-text("제목")').locator('~ input').first().fill('E2E Test Task');
    
    // Click "추가" button to create task (there's only one in the task card)
    await taskCard.locator('button:has-text("추가")').click();
    
    // Should see the new task in kanban board
    await expect(page.getByText('E2E Test Task').first()).toBeVisible({ timeout: 5000 });
  });

  test.skip('should move task between columns (drag and drop)', async ({ page }) => {
    // KNOWN ISSUE: Playwright dragTo encounters pointer interception by <html> element
    // HTML5 DnD in Chromium via Playwright has known limitations; may require CDP or alternative approach
    // Ensure task is present
    const taskItem = page.locator('div.cursor-grab', { hasText: 'E2E Test Task' }).first();
    await expect(taskItem).toBeVisible({ timeout: 5000 });

    // Wait for kanban columns to render
    await page.waitForSelector('[data-status="IN_PROGRESS"]', { timeout: 5000 });

    const inProgressColumn = page.locator('[data-status="IN_PROGRESS"]').first();
    await expect(inProgressColumn).toBeVisible();

    // Use Playwright's dragTo with a small trial timeout to allow events to fire
    await taskItem.dragTo(inProgressColumn, { trial: true, timeout: 3000 });
    await taskItem.dragTo(inProgressColumn);
    
    // Wait for optimistic update and API call to complete
    await page.waitForTimeout(500);

    // Assert task is now inside IN_PROGRESS column
    await expect(inProgressColumn.getByText('E2E Test Task')).toBeVisible({ timeout: 5000 });
  });

  test('should edit task details', async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    // Click on task card to open detail dialog
    await page.locator('text=E2E Test Task').first().click();
    
    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Edit task title (use label to find input, since there's no name attribute)
    const dialog = page.getByRole('dialog');
    const titleInput = dialog.locator('label:has-text("제목")').locator('~ input');
    await titleInput.clear();
    await titleInput.fill('Updated E2E Task');
    
    // Save changes (click save button)
    await dialog.locator('button:has-text("저장")').click();

    // Dialog should close — be resilient to Radix animation by checking data-state attribute first,
    // fallback to visibility check if attribute is not present for some reason.
    const detailDialog = page.getByRole('dialog');
    await expect(detailDialog).toHaveAttribute('data-state', 'closed', { timeout: 5000 }).catch(async () => {
      await expect(detailDialog).not.toBeVisible({ timeout: 5000 });
    });
    
    // Updated title should be visible
    await expect(page.getByText('Updated E2E Task').first()).toBeVisible();
  });

  test('should delete task', async ({ page }) => {
    // Create a new task specifically for deletion (independent test)
    await page.waitForSelector('text=태스크');
    const taskCard = page.locator('text=태스크').locator('..').locator('..');
    
    // Fill task form
    await taskCard.locator('label:has-text("제목")').locator('~ input').first().fill('Delete Me Task');
    
    // Click "추가" button to create task
    await taskCard.locator('button:has-text("추가")').click();
    
    // Wait for task to appear
    await expect(page.getByText('Delete Me Task').first()).toBeVisible({ timeout: 5000 });
    
    // Click on the newly created task card to open dialog
    await page.click('text=Delete Me Task');
    
    // Wait for dialog to open
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    
    // Click delete button in dialog (use dialog context to avoid overlay issues)
    const dialog = page.getByRole('dialog');
    await dialog.locator('button:has-text("삭제")').click();
    
    // Check if there's a confirmation dialog and click if present
    const confirmButton = page.locator('button:has-text("확인")');
    if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmButton.click();
    }
    
    // Task should no longer be visible
    await expect(page.getByText('Delete Me Task')).not.toBeVisible({ timeout: 5000 });
  });
});
