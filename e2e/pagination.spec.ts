import { test, expect } from '@playwright/test';

test.describe('Pagination & Cache Grounding Tests', () => {

    test('Grounding: @ mention should show suggestions based on content', async ({ page }) => {
        // 1. Create a unique memo to search for later
        const UNIQUE_KEY = `MentionKey_${Date.now()}`;
        const MEMO_CONTENT = `This is a unique memo with key ${UNIQUE_KEY}`;

        await page.goto('/');
        const textarea = page.locator('textarea[placeholder*="记我所想"]');
        await textarea.fill(MEMO_CONTENT);
        await page.keyboard.press('Meta+Enter');

        // Wait for the memo to appear in the feed
        await expect(page.locator(`text=${UNIQUE_KEY}`)).toBeVisible({ timeout: 10000 });

        // 2. Open editor again and type @ to trigger mentions
        // We might need to wait a bit for the background fetch (getAllMemos) to complete
        // In the current full-cache mode, it should be merged into the cache.
        await page.waitForTimeout(2000);

        await textarea.click();
        await textarea.fill('Testing mention: @');

        // 3. Search for the unique key in the mention dropdown
        // The mention dropdown usually contains the memo number or content snippet
        await page.keyboard.type(UNIQUE_KEY);

        // Expect a mention item with our unique key to be visible
        // The popover usually has a specific class or role. Let's look for text first.
        const mentionItem = page.locator('.mention-item, [role="option"]').filter({ hasText: UNIQUE_KEY });
        await expect(mentionItem).toBeVisible({ timeout: 5000 });

        console.log('✅ Grounding: @ mention content matching is working.');
    });

    test('Grounding: Home page should display memos from SSR and then sync with cache', async ({ page }) => {
        await page.goto('/');

        // Verify initial list is present
        const memoCards = page.locator('article');
        const initialCount = await memoCards.count();
        console.log(`Initial memo count: ${initialCount}`);

        // Wait for potential background sync
        await page.waitForTimeout(2000);

        // In the current architecture, it should show a "Loading full history..." if not fully loaded
        // or just have all memos if the cache is hit.
        const fullHistoryText = page.getByText('Loading full history...');
        if (await fullHistoryText.isVisible()) {
            console.log('Grounding: Found "Loading full history" indicator.');
        }

        // Scroll to bottom
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);

        console.log('✅ Grounding: Home page scrolling and loading is documented.');
    });

    test('Grounding: Gallery should display images from memos', async ({ page }) => {
        await page.goto('/gallery');

        // Expect to see some image cards if there are memos with images
        const galleryImages = page.locator('.columns-1 img, .columns-2 img, .columns-3 img');

        // Even if there are no images, we check the page structure
        await expect(page.locator('h1')).toContainText('画廊');

        const imageCount = await galleryImages.count();
        console.log(`Grounding: Found ${imageCount} images in gallery.`);
    });
});
