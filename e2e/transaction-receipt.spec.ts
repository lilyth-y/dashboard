import { test, expect, Page } from '@playwright/test'

// Helper: Login as test user
async function login(page: Page) {
    await page.goto('/auth/signin')
    await page.fill('#email', 'user@example.com')
    await page.fill('#password', 'user123!')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
}

test.describe('Transaction Receipt Upload', () => {
    test.beforeEach(async ({ page }) => {
        // Surface console errors
        page.on('console', msg => {
            console.log(`BROWSER ${msg.type().toUpperCase()}:`, msg.text())
        })

        await login(page)

        // Mock Projects List
        await page.route('**/api/projects', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    projects: [
                        { id: 'proj-123', name: 'Test Project' }
                    ]
                })
            })
        })

        // Mock Upload URL Request
        await page.route('**/api/projects/*/documents/upload-url', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    documentId: 'fake-doc-id-123',
                    upload: {
                        url: 'http://localhost:3000/fake-upload-url',
                        headers: { 'Content-Type': 'image/png' },
                        expiresAt: new Date(Date.now() + 3600000).toISOString()
                    },
                    gcs: { bucket: 'fake', objectKey: 'fake', uri: 'gs://fake' }
                })
            })
        })

        // Mock GCS Upload
        await page.route('**/fake-upload-url', async (route) => {
            await route.fulfill({ status: 200 })
        })

        // Mock Enqueue
        await page.route('**/api/documents/*/enqueue', async (route) => {
            await route.fulfill({ status: 200 })
        })
    })

    test('should attach receipt to transaction and submit', async ({ page }) => {
        await page.goto('/dashboard/finance/transactions')
        await page.waitForLoadState('domcontentloaded')

        // Click Add Transaction
        const projectResponsePromise = page.waitForResponse(resp => resp.url().includes('/api/projects'));
        const addButton = page.getByRole('button', { name: '거래 추가' })
        await addButton.click()

        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()

        // Wait for projects to load (triggers re-render)
        await projectResponsePromise;

        // Fill form fields
        await dialog.locator('#amount').fill('15000')
        await dialog.locator('#description').fill('Lunch Receipt')

        // Select Category
        const categoryTrigger = dialog.getByRole('combobox').filter({ hasText: '카테고리를 선택하세요' })
        await categoryTrigger.click()
        await page.keyboard.press('ArrowDown') // first option
        await page.keyboard.press('Enter')

        // Select Project (Required for Upload)
        const projectLabel = page.getByText('프로젝트 (선택사항)')
        await expect(projectLabel).toBeVisible({ timeout: 10000 })

        const projectTrigger = dialog.getByRole('combobox').filter({ hasText: '프로젝트를 선택하세요' })
        await expect(projectTrigger).toBeVisible({ timeout: 10000 })
        await projectTrigger.click()

        const projectOption = page.getByRole('option', { name: 'Test Project' })
        await expect(projectOption).toBeVisible()
        await projectOption.click()

        // Select Date
        await dialog.locator('#date').fill('2023-12-25')

        // Upload Receipt
        const fileInput = dialog.locator('input[type="file"]')
        await fileInput.setInputFiles({
            name: 'receipt.png',
            mimeType: 'image/png',
            buffer: Buffer.from('fake-image-content')
        })

        // Wait for upload to complete
        await expect(dialog.getByText('문서 ID: fake-doc-id-123')).toBeVisible()

        // Mock Transaction Submit to verify payload
        let requestBody: any = null
        await page.route('**/api/financial/transactions', async (route) => {
            if (route.request().method() === 'POST') {
                requestBody = route.request().postDataJSON()
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ message: 'Success', transaction: { id: 'tx-new' } })
                })
            } else {
                await route.continue() // allow GET
            }
        })

        // Submit
        await dialog.locator('button[type="submit"]:has-text("거래 등록")').click()

        // Dialog should close
        await expect(dialog).toBeHidden()

        // Verify Payload
        expect(requestBody).toBeTruthy()
        expect(requestBody.receiptId).toBe('fake-doc-id-123')
        expect(requestBody.amount).toBe(15000)
    })
})
