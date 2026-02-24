import { test, expect } from '@playwright/test';

test.describe('Core Feature Flow', () => {
    test.beforeEach(async ({ page }) => {
        // 1. Visit Homepage
        await page.goto('/');

        const email = process.env.E2E_EMAIL;
        const password = process.env.E2E_PASSWORD;

        if (email && password) {
            // 如果已经在首页看到了编辑器，说明已登录，跳过
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
            
            // 3. 等待转场动画 (HOME -> CARD -> SPLIT)
            // 动画时间约 400ms，这里给 2000ms 确保稳定进入视口
            await page.waitForTimeout(2000); 

            // 4. 输入邮箱并按回车
            const emailInput = page.locator('input[name="email"]');
            await emailInput.waitFor({ state: 'visible' });
            await emailInput.fill(email);
            console.log('Email filled, pressing Enter...');
            await page.keyboard.press('Enter');

            // 5. 等待并输入密码并按回车
            const passwordInput = page.locator('input[name="password"]');
            await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
            await passwordInput.fill(password);
            console.log('Password filled, pressing Enter...');
            await page.keyboard.press('Enter');

            // 6. 处理页面刷新 (window.location.reload())
            console.log('Waiting for reload and editor visibility...');
            await page.waitForLoadState('networkidle');
            // 增加等待时间，确保权限加载完成
            await page.locator('.tiptap').waitFor({ state: 'visible', timeout: 20000 });
            console.log('--- Login Success, Editor is Ready ---');
        }
    });

    test('should create, search, delete, and permanently destroy a memo', async ({ page }) => {
        const TEST_CONTENT = `E2E_AutoTest_${Date.now()}`;

        // 1. Create Memo
        const editor = page.locator('.tiptap');
        await editor.click(); 
        await editor.fill(TEST_CONTENT);
        await page.getByRole('button', { name: '发布' }).click();

        // 2. Verify Creation
        await expect(page.locator(`text=${TEST_CONTENT}`)).toBeVisible({ timeout: 15000 });

        // 3. Test Search
        const searchInput = page.locator('input[placeholder*="搜索"]'); 
        await searchInput.fill(TEST_CONTENT);
        await page.waitForTimeout(1000);
        await expect(page.locator(`text=${TEST_CONTENT}`)).toBeVisible();

        // 4. Delete (Soft)
        const memoCard = page.locator('article', { hasText: TEST_CONTENT });
        await memoCard.hover();

        const moreBtn = memoCard.locator('button').filter({ has: page.locator('svg') }).last();
        await moreBtn.click();

        page.once('dialog', dialog => dialog.accept());
        await page.getByText('移入垃圾箱').click();
        await expect(memoCard).toBeHidden();

        // 5. Check Trash
        await page.goto('/trash');
        const trashCard = page.locator('article', { hasText: TEST_CONTENT });
        await expect(trashCard).toBeVisible();

        // 6. Permanent Delete
        const destroyBtn = trashCard.locator('button[title="彻底删除"]');
        page.once('dialog', dialog => dialog.accept());
        await destroyBtn.click();

        // 7. Verify Disappearance
        await expect(trashCard).toBeHidden();
    });
});
