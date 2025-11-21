import { test, expect } from '@playwright/test';

test.describe('Simulation File Upload', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
    console.log('Navigating to signin...');
    // Login before each test
    await page.goto('/auth/signin', { timeout: 60000 });
    console.log('Filling credentials...');
    await page.fill('#email', 'user@example.com');
    await page.fill('#password', 'user123!');
    console.log('Clicking submit...');
    await page.click('button[type="submit"]');
    console.log('Waiting for dashboard...');
    await expect(page).toHaveURL('/dashboard', { timeout: 60000 });
    console.log('Logged in!');
  });

  test('should upload a file and populate the form', async ({ page }) => {
    // Mock the API response
    await page.route('**/api/analyze-file', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          current_runway: 12,
          monthly_burn_rate: 50000,
          recommended_budget: 600000,
          confidence_score: 0.95,
          currency: 'USD'
        }),
      });
    });

    // Navigate to the finance page
    await page.goto('/dashboard/finance'); 

    // Wait for the page to load
    await expect(page.getByText('Financial Overview')).toBeVisible();
    await expect(page.getByText('Runway Simulator')).toBeVisible();

    // Prepare a dummy file
    const fileContent = 'Date,Description,Amount\n2023-01-01,Test,100';
    const fileName = 'test-data.csv';
    const buffer = Buffer.from(fileContent);

    // Trigger file upload
    // The input is hidden inside the button, so we locate it by type="file"
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: fileName,
      mimeType: 'text/csv',
      buffer: buffer,
    });

    // Verify that the form fields are populated
    await expect(page.getByLabel('Current Runway (Months)')).toHaveValue('12');
    await expect(page.getByLabel('Monthly Burn Rate')).toHaveValue('50000');
    await expect(page.getByLabel('Target Budget')).toHaveValue('600000');
    
    // Verify confidence score
    await expect(page.getByText('95%')).toBeVisible();
  });
});
