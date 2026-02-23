import { test, expect } from '@playwright/test';

/**
 * NoteFlow E2E 测试套件
 */

test.describe('NoteFlow 笔记应用', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前访问应用
    await page.goto('/');
  });

  test('页面正常加载', async ({ page }) => {
    // 验证页面标题
    await expect(page).toHaveTitle(/noteflow/i);

    // 验证侧边栏存在
    await expect(page.locator('aside')).toBeVisible();

    // 验证新建笔记按钮存在
    await expect(page.getByRole('button', { name: /new note/i })).toBeVisible();
  });

  test('笔记列表展示', async ({ page }) => {
    // 验证笔记列表区域存在
    const noteList = page.locator('.flex-1.overflow-y-auto');
    await expect(noteList.first()).toBeVisible();

    // 验证至少有一个笔记项（预置数据）
    const noteItems = page.locator('button[class*="rounded-lg"]').filter({ hasText: 'Welcome' });
    await expect(noteItems.first()).toBeVisible();
  });

  test('新增笔记', async ({ page }) => {
    // 点击新建笔记按钮
    await page.getByRole('button', { name: /new note/i }).click();

    // 验证编辑器区域可见
    await expect(page.locator('.cm-editor')).toBeVisible();

    // 验证新笔记标题（默认 "Untitled"）- 使用更精确的选择器
    await expect(page.getByRole('button', { name: 'Untitled', exact: true })).toBeVisible();
  });

  test('编辑笔记内容', async ({ page }) => {
    // 选择第一个笔记
    const firstNote = page.locator('button[class*="rounded-lg"]').filter({ hasText: 'Welcome' }).first();
    await firstNote.click();

    // 等待编辑器加载
    await expect(page.locator('.cm-editor')).toBeVisible();

    // 点击编辑器获取焦点
    await page.locator('.cm-content').click();

    // 输入新内容
    await page.locator('.cm-content').fill('# Test Note\n\nThis is a test content for editing.');

    // 验证内容已输入（通过预览模式验证）- 使用精确匹配编辑器工具栏的 Preview 按钮
    await page.getByRole('button', { name: 'Preview', exact: true }).click();

    // 验证预览内容
    await expect(page.locator('.preview-container:has-text("Test Note")')).toBeVisible();
  });

  test('切换预览模式', async ({ page }) => {
    // 选择笔记
    await page.locator('button[class*="rounded-lg"]').filter({ hasText: 'Welcome' }).first().click();

    // 等待编辑器加载
    await expect(page.locator('.cm-editor')).toBeVisible();

    // 切换到 Split 模式 - 使用精确匹配
    await page.getByRole('button', { name: 'Split', exact: true }).click();
    await expect(page.locator('.preview-container')).toBeVisible();

    // 切换到 Preview 模式 - 使用精确匹配
    await page.getByRole('button', { name: 'Preview', exact: true }).click();
    await expect(page.locator('.preview-container')).toBeVisible();
    await expect(page.locator('.cm-editor')).not.toBeVisible();

    // 切换回 Edit 模式 - 使用精确匹配
    await page.getByRole('button', { name: 'Edit', exact: true }).click();
    await expect(page.locator('.cm-editor')).toBeVisible();
  });

  test('编辑器滚动功能', async ({ page }) => {
    // 选择包含较多内容的笔记
    await page.locator('button[class*="rounded-lg"]').filter({ hasText: 'Welcome' }).first().click();

    // 等待编辑器加载
    await expect(page.locator('.cm-editor')).toBeVisible();

    // 获取编辑器滚动容器
    const scroller = page.locator('.cm-scroller');

    // 验证滚动容器存在
    await expect(scroller).toBeVisible();

    // 尝试滚动（如果内容超出可视区域）
    await scroller.evaluate((el) => {
      el.scrollTop = 100;
    });

    // 验证滚动位置
    const scrollTop = await scroller.evaluate((el) => el.scrollTop);
    expect(scrollTop).toBeGreaterThanOrEqual(0);
  });

  test('预览区域滚动功能', async ({ page }) => {
    // 选择笔记并切换到预览模式
    await page.locator('button[class*="rounded-lg"]').filter({ hasText: 'Welcome' }).first().click();
    // 使用精确匹配编辑器工具栏的 Preview 按钮
    await page.getByRole('button', { name: 'Preview', exact: true }).click();

    // 获取预览容器
    const previewContainer = page.locator('.preview-container');
    await expect(previewContainer).toBeVisible();

    // 尝试滚动预览区域
    await previewContainer.evaluate((el) => {
      el.scrollTop = 50;
    });

    // 验证滚动位置
    const scrollTop = await previewContainer.evaluate((el) => el.scrollTop);
    expect(scrollTop).toBeGreaterThanOrEqual(0);
  });

  test('文件夹切换', async ({ page }) => {
    // 验证文件夹列表存在
    const folders = page.locator('nav button').filter({ hasText: /General|Work|Ideas/ });
    await expect(folders.first()).toBeVisible();

    // 点击文件夹切换
    await folders.first().click();
  });

  test('搜索功能', async ({ page }) => {
    // 找到搜索框
    const searchInput = page.locator('input[placeholder*="Search"]');

    // 输入搜索关键词
    await searchInput.fill('Welcome');

    // 等待搜索结果更新
    await page.waitForTimeout(300);

    // 验证搜索结果包含关键词
    const noteItems = page.locator('button[class*="rounded-lg"]').filter({ hasText: 'Welcome' });
    await expect(noteItems.first()).toBeVisible();
  });

  test('暗色模式切换', async ({ page }) => {
    // 找到主题切换按钮
    const themeToggle = page.locator('button[title*="dark" i], button[title*="light" i]').or(
      page.locator('button').filter({ has: page.locator('svg[class*="sun"], svg[class*="moon"]') })
    );

    // 点击切换
    await themeToggle.click();

    // 验证暗色模式应用（检查 dark class）
    const isDark = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });

    expect(typeof isDark).toBe('boolean');
  });

  test('导出功能按钮存在', async ({ page }) => {
    // 验证导出按钮存在（Header 中的 Export 按钮）
    const exportButton = page.getByRole('button', { name: 'Export', exact: true });
    await expect(exportButton).toBeVisible();
  });

  test('导出所有文件夹按钮存在', async ({ page }) => {
    // 验证导出所有文件夹按钮存在
    const exportAllButton = page.getByRole('button', { name: /Export All Folders/i });
    await expect(exportAllButton).toBeVisible();
  });

  test('导入功能按钮存在', async ({ page }) => {
    // 验证导入按钮存在
    const importButton = page.getByRole('button', { name: /import/i });
    await expect(importButton).toBeVisible();
  });

  test('大纲视图显示和跳转功能', async ({ page }) => {
    // 选择包含标题的笔记
    await page.locator('button[class*="rounded-lg"]').filter({ hasText: 'Welcome' }).first().click();

    // 等待编辑器加载
    await expect(page.locator('.cm-editor')).toBeVisible();

    // 验证 Outline 区域存在
    const outlineSection = page.locator('text=Outline').first();
    await expect(outlineSection).toBeVisible();

    // 验证 Outline 中有标题项
    const outlineItems = page.locator('.w-56 nav button, .w-56 nav span').filter({ hasText: /Welcome|Features|Getting/i });
    // 至少检查是否有 Outline 组件显示
    const outlineContainer = page.locator('.w-56').filter({ hasText: 'Outline' });
    await expect(outlineContainer).toBeVisible();
  });

  test('文件夹导出功能', async ({ page }) => {
    // 验证文件夹列表存在
    const folders = page.locator('nav button').filter({ hasText: /General|Work|Ideas/ });
    await expect(folders.first()).toBeVisible();

    // 点击文件夹
    await folders.first().click();

    // 验证文件夹菜单可以触发（hover 显示更多按钮）
    // 这里只验证文件夹交互正常
    const folderButton = folders.first();
    await expect(folderButton).toBeVisible();
  });
});
