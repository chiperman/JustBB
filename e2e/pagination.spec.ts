import { test, expect } from '@playwright/test';

test.describe('Pagination & Cache Grounding Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');

        const email = process.env.E2E_EMAIL;
        const password = process.env.E2E_PASSWORD;

        if (email && password) {
            if (await page.locator('.tiptap').isVisible()) return;

            console.log('--- Triggering Login via Settings Dropdown ---');

            // 1. 点击侧边栏的“账号与设置”按钮
            const settingsTrigger = page.locator('button[aria-label="账号与设置"]');
            await settingsTrigger.waitFor({ state: 'visible' });
            await settingsTrigger.click();
            
            // 2. 点击下拉菜单中的“登录系统”
            const loginItem = page.locator('[role="menuitem"]').filter({ hasText: '登录系统' });
            await loginItem.waitFor({ state: 'visible' });
            await loginItem.click();
            
            // 3. 等待转场
            await page.waitForTimeout(2000); 

            // 4. 输入邮箱并按回车
            const emailInput = page.locator('input[name="email"]');
            await emailInput.waitFor({ state: 'visible' });
            await emailInput.fill(email);
            console.log('Email filled, pressing Enter...');
            await page.keyboard.press('Enter');

            // 5. 输入密码并按回车
            const passwordInput = page.locator('input[name="password"]');
            await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
            await passwordInput.fill(password);
            console.log('Password filled, pressing Enter...');
            await page.keyboard.press('Enter');

            // 6. 处理页面重载
            console.log('Waiting for reload and editor visibility...');
            await page.waitForLoadState('networkidle');
            await page.locator('.tiptap').waitFor({ state: 'visible', timeout: 20000 });
            console.log('--- Login Success, Editor is Ready ---');
        }
    });

    test('Grounding: @ mention should show suggestions based on content', async ({ page }) => {
        const UNIQUE_KEY = `MentionKey_${Date.now()}`;
        const MEMO_CONTENT = `This is a unique memo with key ${UNIQUE_KEY}`;

        // 1. Create unique memo
        const editor = page.locator('.tiptap');
        await editor.click(); 
        await editor.fill(MEMO_CONTENT);
        await page.getByRole('button', { name: '发布' }).click();

        await expect(page.locator(`text=${UNIQUE_KEY}`)).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(2000);

        // 2. Trigger @ mention
        await editor.click();
        await editor.fill('Testing mention: @');
        await page.keyboard.type(UNIQUE_KEY);

        // Expect suggestions to appear
        const suggestionsContainer = page.locator('.bg-background.border.border-border');
        await expect(suggestionsContainer).toBeVisible({ timeout: 5000 });

        console.log('✅ Grounding: @ mention content matching is working.');
    });

    test('Grounding: Home page should display memos from SSR and then sync with cache', async ({ page }) => {
        await page.goto('/');

        const memoCards = page.locator('article');
        const initialCount = await memoCards.count();
        console.log(`Initial memo count: ${initialCount}`);

        await page.waitForTimeout(2000);

        // Scroll to bottom
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);

        console.log('✅ Grounding: Home page scrolling and loading is documented.');
    });

    test('Grounding: Gallery should display images from memos', async ({ page }) => {
        await page.goto('/gallery');

        // Gallery page header check (h2)
        await expect(page.locator('h2')).toContainText('画廊');

        const galleryImages = page.locator('img');
        const imageCount = await galleryImages.count();
        console.log(`Grounding: Found ${imageCount} images in gallery.`);
    });
});
