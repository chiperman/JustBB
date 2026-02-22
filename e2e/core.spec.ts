import { test, expect } from '@playwright/test';

test.describe('Core Feature Flow', () => {
    test('should create, search, delete, and permanently destroy a memo', async ({ page }) => {
        const TEST_CONTENT = `E2E_AutoTest_${Date.now()}`;

        // 1. Visit Homepage
        await page.goto('/');

        // 2. Create Memo
        const textarea = page.locator('textarea[placeholder*="记我所想"]'); // Adjust selector based on actual placeholder
        await textarea.fill(TEST_CONTENT);
        await textarea.press('Meta+Enter'); // or click send button
        // Backup: click send button if shortcut fails or just to be sure
        // Assuming Send button is near. But Ctrl+Enter is supported.
        // Let's find the button to be safe. ArrowUp icon button.
        const sendBtn = page.locator('button').filter({ has: page.locator('svg') }).last(); // Looking for the send button (PaperPlane/ArrowUp equivalent)
        if (await sendBtn.isVisible()) {
            await sendBtn.click();
        }

        // 3. Verify Creation (Stream updates)
        await expect(page.locator(`text=${TEST_CONTENT}`)).toBeVisible({ timeout: 10000 });

        // 4. Test Search
        const searchInput = page.locator('input[type="text"]'); // Search input
        await searchInput.fill(TEST_CONTENT);
        // Debounce wait
        await page.waitForTimeout(1000);
        // Verify only our memo is visible (or at least it is visible)
        await expect(page.locator(`text=${TEST_CONTENT}`)).toBeVisible();

        // 5. Delete (Soft)
        // Find the memo card that contains our text
        const memoCard = page.locator('article', { hasText: TEST_CONTENT });
        await memoCard.hover(); // Hover to show actions

        const moreBtn = memoCard.locator('button[data-slot="button"]').filter({ has: page.locator('svg') }); // More horizontal icon button
        await moreBtn.click();

        // Setup dialog handler for Delete confirmation
        page.once('dialog', dialog => {
            console.log(`Dialog message: ${dialog.message()}`);
            dialog.accept();
        });

        await page.getByText('移入垃圾箱').click();

        // Wait for disappearance
        await expect(memoCard).toBeHidden();

        // 6. Check Trash
        await page.getByRole('link', { name: '垃圾箱' }).click();
        await expect(page).toHaveURL(/.*\/trash/);

        // Verify content in trash
        const trashCard = page.locator('article', { hasText: TEST_CONTENT });
        await expect(trashCard).toBeVisible();

        // 7. Permanent Delete
        // Trash items display actions directly (no dropdown needed usually, or check UI)
        // Based on MemoActions for isDeleted=true: returns buttons directly.
        const destroyBtn = trashCard.locator('button[title="彻底删除"]');

        page.once('dialog', dialog => {
            console.log(`Dialog message: ${dialog.message()}`);
            dialog.accept();
        });

        await destroyBtn.click();

        // 8. Verify Disappearance in Trash
        await expect(trashCard).toBeHidden();
    });
});
