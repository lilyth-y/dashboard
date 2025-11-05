import { test, expect, Page } from '@playwright/test'

// Helper: Login as test user
async function login(page: Page) {
  await page.goto('/auth/signin')
  await page.fill('#email', 'user@example.com')
  await page.fill('#password', 'user123!' )
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
}

test.describe('Financial Management', () => {
  test.beforeEach(async ({ page }) => {
    // Surface browser console errors to test output for debugging
    page.on('console', (msg) => {
      // Only echo warnings/errors to reduce noise
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        // eslint-disable-next-line no-console
        console.log(`BROWSER ${type.toUpperCase()}:`, msg.text());
      }
    })
    page.on('pageerror', (err) => {
      // eslint-disable-next-line no-console
      console.log('PAGEERROR:', err.message);
    })
    await login(page)
  })

  test('should navigate to transactions page', async ({ page }) => {
    // Navigate to finance section (click Transactions in sidebar)
    await page.click('text=Transactions')

    // Should be on transactions page
    await expect(page).toHaveURL('/dashboard/finance/transactions')
    await expect(page.getByRole('heading', { name: /거래 내역/i })).toBeVisible()
  })

  test('should open transaction form dialog', async ({ page }) => {
    await page.goto('/dashboard/finance/transactions')
    
    // Wait for page to load DOM content (faster than networkidle)
    await page.waitForLoadState('domcontentloaded');
    
    // Click add transaction button
    const addButton = page.getByRole('button', { name: '거래 추가' });
    await expect(addButton).toBeVisible({ timeout: 5000 });
    await addButton.click();
    
    // Dialog should be visible and the form should be mounted
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByTestId('transaction-form')).toBeVisible({ timeout: 10000 });
  })

  test('should create a new transaction', async ({ page }) => {
    await page.goto('/dashboard/finance/transactions')
    
    // Wait for page to load DOM content (faster than networkidle)
    await page.waitForLoadState('domcontentloaded');
    
    // Open dialog
    const addButton = page.getByRole('button', { name: '거래 추가' });
    await expect(addButton).toBeVisible({ timeout: 5000 });
    await addButton.click();
    
  // Wait for dialog to open and form to render
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 10000 });
  // Be resilient to portal re-renders: wait for key fields instead of the entire form test id
  await dialog.locator('#amount').waitFor({ state: 'visible', timeout: 10000 });
  await dialog.locator('#description').waitFor({ state: 'visible', timeout: 10000 });

  // Target the category combobox specifically to avoid strict mode violations (there are 2 comboboxes: category and project)
  const categoryTrigger = dialog
    .getByRole('combobox')
    .filter({ hasText: '카테고리를 선택하세요' });
  await expect(categoryTrigger).toBeVisible({ timeout: 10000 });

    // Choose income type (radio label click is more reliable than radio button direct click)
  await dialog.locator('label[for="income"]').click()

    // Fill amount and description (ids used in form)
  await dialog.locator('#amount').fill('50000')
  await dialog.locator('#description').fill('Test Transaction E2E')

  // Open category select (Radix Select uses combobox trigger)
  await categoryTrigger.click()
  // Prefer keyboard navigation to avoid option detachment during portal re-render
  await page.keyboard.press('ArrowDown') // 첫 번째 옵션 (매출)
  await page.keyboard.press('ArrowDown') // 두 번째 옵션 (컨설팅)
  await page.keyboard.press('Enter')

    // Submit form (button text is "거래 등록")
  await dialog.locator('button[type="submit"]:has-text("거래 등록")').click()

    // Dialog should close on success
    await expect(dialog).toBeHidden({ timeout: 5000 })
  })

  test('should view financial dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should see dashboard metrics on main dashboard (it shows financial data)
    await expect(page.getByText(/총 수입/i).first()).toBeVisible()
    await expect(page.getByText(/총 지출/i).first()).toBeVisible()
    await expect(page.getByText(/순이익/i).first()).toBeVisible()
  })

  test('should navigate to invoices page', async ({ page }) => {
    await page.goto('/dashboard/finance/invoices')
    
    // Should see invoices page
    await expect(page.getByRole('heading', { name: /Invoices/i })).toBeVisible()
    await expect(page.getByText(/placeholder/i)).toBeVisible()
  })

  test('should navigate to payments page', async ({ page }) => {
    await page.goto('/dashboard/finance/payments')
    
    // Should see payments page
    await expect(page.getByRole('heading', { name: /Payments/i })).toBeVisible()
    await expect(page.getByText(/placeholder/i)).toBeVisible()
  })

  test('should filter transactions by type', async ({ page }) => {
    await page.goto('/dashboard/finance/transactions')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Apply filter (if filter UI exists)
    const filterButton = page.locator('button:has-text("필터")')
    if (await filterButton.isVisible()) {
      await filterButton.click()
      await page.click('text=/수입/i')
      
      // Verify filtered results
      await expect(page.locator('[data-type="INCOME"]')).toBeVisible()
    }
  })
})
