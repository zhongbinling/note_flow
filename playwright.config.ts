import { defineConfig, devices } from '@playwright/test';

/**
 * NoteFlow Playwright 测试配置
 * 用于测试本地运行的笔记应用
 */
export default defineConfig({
  // 测试目录
  testDir: './tests',

  // 完全并行运行测试
  fullyParallel: true,

  // CI 上禁止 test.only
  forbidOnly: !!process.env.CI,

  // CI 上重试失败测试
  retries: process.env.CI ? 2 : 0,

  // CI 上限制并行 workers
  workers: process.env.CI ? 1 : undefined,

  // Reporter 配置
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],

  // 全局测试配置
  use: {
    // 基础 URL
    baseURL: 'http://localhost:5180',

    // 收集失败测试的 trace
    trace: 'on-first-retry',

    // 截图配置
    screenshot: 'only-on-failure',

    // 视频录制（可选）
    video: 'retain-on-failure',

    // 默认超时时间
    actionTimeout: 10000,
  },

  // 配置项目（浏览器）
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 配置 Web Server（本地开发服务器）
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5180',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
