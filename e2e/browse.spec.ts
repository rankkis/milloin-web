import { expect, Page, test } from '@playwright/test';

/** Fails the test on any uncaught error in the page */
const watchErrors = (page: Page): Error[] => {
  const errors: Error[] = [];
  page.on('pageerror', (error) => errors.push(error));
  return errors;
};

/**
 * Starts the visit with analytics already declined, as a returning visitor:
 * the banner stays closed and no test visit reaches Google Analytics.
 */
const declineAnalytics = (page: Page): Promise<void> =>
  page.addInitScript(() => localStorage.setItem('milloin-analytics-consent', 'denied'));

test('home lists the questions and links to the Sähkö page', async ({ page }) => {
  const errors = watchErrors(page);
  await declineAnalytics(page);
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Milloin…');
  await expect(page.getByTestId('home-electricity-price')).toContainText('c/kWh');

  await page.getByTestId('home-electricity-price').click();
  await expect(page).toHaveURL(/\/sahko-on-halpaa$/);
  await expect(page.locator('h1')).toHaveText('Sähkön hinta nyt');
  await expect(page.locator('app-hourly-chart')).toBeVisible();
  expect(errors).toEqual([]);
});

test('the consent banner closes and stays closed', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('consent-reject').click();
  await expect(page.getByTestId('consent-reject')).toBeHidden();
  await page.reload();
  await expect(page.locator('h1')).toHaveText('Milloin…');
  await expect(page.getByTestId('consent-reject')).toBeHidden();
});

const QUESTIONS = [
  { link: 'electricity-wash-laundry', h1: 'Milloin pestään pyykit?' },
  { link: 'electricity-charge-ev', h1: 'Milloin ladataan auto?' },
  { link: 'electricity-sauna', h1: 'Milloin saunotaan?' },
];

for (const question of QUESTIONS) {
  test(`${question.h1} answers from the Sähkö page`, async ({ page }) => {
    const errors = watchErrors(page);
    await declineAnalytics(page);
    await page.goto('/sahko-on-halpaa');
    await page.getByTestId(question.link).click();
    await expect(page.locator('h1')).toHaveText(question.h1);
    // The answer replaces the loading spinner
    await expect(page.locator('.answer__value').first()).toBeVisible();
    await expect(page.locator('app-spinner')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test('the developer docs open from the home footer', async ({ page }) => {
  const errors = watchErrors(page);
  await declineAnalytics(page);
  await page.goto('/');
  await page.getByTestId('home-api').click();
  await expect(page).toHaveURL(/\/docs$/);
  await expect(page.locator('h1')).toHaveText('milloin.xyz API');

  await page.getByTestId('docs-nav-home-assistant').click();
  await expect(page.locator('h1')).toHaveText('Home Assistant');
  await expect(page.locator('app-code-block').first()).toContainText('value_json.current.price');
  expect(errors).toEqual([]);
});

test('the API reference draws the OpenAPI document', async ({ page }) => {
  await declineAnalytics(page);
  await page.goto('/docs/reference');
  await expect(page.locator('h1')).toHaveText('API reference');
  // Scalar loads from its CDN and draws the operations from the document
  await expect(page.locator('.reference').getByText('/v1/prices/current').first()).toBeVisible({ timeout: 20_000 });
});

test('milloin.xyz/api opens the docs', async ({ request, baseURL }) => {
  test.skip(baseURL?.includes('localhost') ?? true, 'needs a Vercel deployment');
  const response = await request.get('/api', { maxRedirects: 0 });
  expect([302, 307]).toContain(response.status());
  expect(response.headers()['location']).toMatch(/\/docs$/);
});

test('the public API answers through milloin.xyz/api', async ({ request, baseURL }) => {
  // The /api rewrites are Vercel's, so a local server render has none
  test.skip(baseURL?.includes('localhost') ?? true, 'needs a Vercel deployment');
  const response = await request.get('/api/openapi.json');
  expect(response.ok()).toBe(true);
  expect((await response.json()).openapi).toMatch(/^3\./);
});
