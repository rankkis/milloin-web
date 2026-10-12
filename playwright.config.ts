import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests against a running site: a Vercel deployment in CI
 * (BASE_URL from the deployment_status event), or the local server render
 * (`npm run serve:ssr:milloin-web-app`) by default.
 */
const bypassSecret = process.env['VERCEL_AUTOMATION_BYPASS_SECRET'];

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    // The site's templates mark links and buttons with data-test-id
    testIdAttribute: 'data-test-id',
    baseURL: process.env['BASE_URL'] ?? 'http://localhost:4000',
    // Lets the tests through Vercel Deployment Protection on previews
    extraHTTPHeaders: bypassSecret
      ? { 'x-vercel-protection-bypass': bypassSecret, 'x-vercel-set-bypass-cookie': 'true' }
      : {},
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
});
