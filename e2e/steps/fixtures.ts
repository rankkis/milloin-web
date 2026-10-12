import { APIResponse, expect } from '@playwright/test';
import { test as base } from 'playwright-bdd';

/** State a scenario's steps share */
interface ScenarioContext {
  response?: APIResponse;
}

/**
 * Every scenario starts with analytics declined, as a returning visitor, and
 * fails on any uncaught error in the page. @vercel scenarios need a Vercel
 * deployment (its redirects and rewrites), so they skip on a local server.
 */
export const test = base.extend<{ ctx: ScenarioContext; browserProblems: string[]; visitor: void }>({
  // Playwright reads a fixture's dependencies from its first argument, so it must be a pattern
  // eslint-disable-next-line no-empty-pattern
  ctx: async ({}, use) => use({}),
  browserProblems: async ({ page }, use) => {
    const problems: string[] = [];
    page.on('console', (message) => message.type() === 'error' && problems.push(message.text()));
    page.on('requestfailed', (request) => problems.push(`${request.url()}: ${request.failure()?.errorText}`));
    await use(problems);
  },
  visitor: [
    async ({ page, baseURL, $tags }, use) => {
      test.skip($tags.includes('@vercel') && (baseURL?.includes('localhost') ?? true), 'needs a Vercel deployment');
      await page.addInitScript(() => localStorage.setItem('milloin-analytics-consent', 'denied'));
      const errors: Error[] = [];
      page.on('pageerror', (error) => errors.push(error));
      await use();
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});
