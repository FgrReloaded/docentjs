import { defineConfig, devices } from '@playwright/test'

const port = 4180

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      // Locally reuse the installed Chrome; CI installs Playwright's Chromium.
      use: { ...devices['Desktop Chrome'], ...(process.env.CI ? {} : { channel: 'chrome' }) },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], ...(process.env.CI ? {} : { channel: 'chrome' }) },
    },
  ],
  webServer: {
    command: 'node e2e/server.mjs',
    port,
    reuseExistingServer: !process.env.CI,
    env: { PORT: String(port) },
  },
})
