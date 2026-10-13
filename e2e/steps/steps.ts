import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from './fixtures';

const { Given, When, Then } = createBdd(test);

const h1Of = (html: string): string | undefined => html.match(/<h1[^>]*>([^<]*)/)?.[1].trim();

Given('I open {string}', async ({ page }, path: string) => {
  await page.goto(path);
});

When('I follow {string}', async ({ page }, testId: string) => {
  await page.getByTestId(testId).click();
});

Then('I am on {string}', async ({ page }, path: string) => {
  await expect(page).toHaveURL((url) => url.pathname === path);
});

Then('the heading is {string}', async ({ page }, heading: string) => {
  // The page's own heading comes first; the API reference adds Scalar's below it
  await expect(page.locator('h1').first()).toHaveText(heading);
});

Then('a code sample contains {string}', async ({ page }, text: string) => {
  await expect(page.locator('app-code-block').filter({ hasText: text }).first()).toBeVisible();
});

Then('the API reference lists {string}', async ({ page, browserProblems }, text: string) => {
  // Scalar loads from its CDN and draws the operations from the document
  await expect(page.locator('.reference').getByText(text).first())
    .toBeVisible({ timeout: 20_000 })
    .catch((error: Error) => {
      // Name what failed in the browser, such as the CDN or the OpenAPI document
      throw new Error(`${error.message}\n${browserProblems.join('\n')}`);
    });
});

Then('the API reference does not list {string}', async ({ page }, text: string) => {
  // Checked once the reference has drawn, after a step that waited for it
  await expect(page.locator('.reference').getByText(text)).toHaveCount(0);
});

When('the server renders {string}', async ({ ctx, request }, path: string) => {
  ctx.response = await request.get(path);
});

Then('the page answers 200 with the heading {string}', async ({ ctx }, heading: string) => {
  expect(ctx.response?.status()).toBe(200);
  const html = (await ctx.response?.text()) ?? '';
  expect(h1Of(html)).toBe(heading);
  expect(html).toContain('<link rel="canonical"');
});

When('I request {string} without following redirects', async ({ ctx, request }, path: string) => {
  ctx.response = await request.get(path, { maxRedirects: 0 });
});

Then('it redirects to {string}', async ({ ctx }, path: string) => {
  expect([301, 302, 307, 308]).toContain(ctx.response?.status());
  expect(new URL(ctx.response?.headers()['location'] ?? '', 'https://milloin.xyz').pathname).toBe(path);
});
