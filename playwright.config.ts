import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

/**
 * End-to-end tests against a running site: a Vercel deployment in CI
 * (BASE_URL from the deployment_status event), or the local server render
 * (`npm run serve:ssr:milloin-web-app`) by default.
 */
const bypassSecret = process.env['VERCEL_AUTOMATION_BYPASS_SECRET'];

/** Gherkin scenarios (e2e/features) with their steps (e2e/steps), generated into Playwright tests by bddgen */
const featuresDir = defineBddConfig({
  features: 'e2e/features/**/*.feature',
  steps: 'e2e/steps/**/*.ts',
  outputDir: '.features-gen',
});

export default defineConfig({
  testDir: 'e2e',
  testIgnore: ['steps/**'],
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    // The site's templates mark links and buttons with data-test-id
    testIdAttribute: 'data-test-id',
    baseURL: process.env['BASE_URL'] ?? 'http://localhost:4000',
    // Lets the tests through Vercel Deployment Protection on previews. Sent on
    // every request, so no bypass cookie is needed (asking for one answers
    // with a 307 that hides the site's own redirects).
    extraHTTPHeaders: bypassSecret
      ? { 'x-vercel-protection-bypass': bypassSecret }
      : {},
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
    { name: 'desktop-features', testDir: featuresDir, use: { ...devices['Desktop Chrome'] } },
    { name: 'phone-features', testDir: featuresDir, use: { ...devices['Pixel 7'] } },
  ],
});
