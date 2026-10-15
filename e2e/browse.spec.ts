import { expect, Page, test } from './support/test';

/** Fails the test on any uncaught error in the page */
const watchErrors = (page: Page): Error[] => {
  const errors: Error[] = [];
  page.on('pageerror', (error) => errors.push(error));
  return errors;
};

/**
 * Starts the visit with cookies already declined, as a returning visitor, so
 * the consent banner stays closed if it is turned on again.
 */
const declineAnalytics = (page: Page): Promise<void> =>
  page.addInitScript(() => localStorage.setItem('milloin-analytics-consent', 'denied'));

test('home lists the questions and links its spot price to the price page', async ({ page }) => {
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

test('shows no consent banner and loads no Google Analytics', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Milloin…');
  await expect(page.getByTestId('consent-reject')).toHaveCount(0);
  await expect(page.locator('script[src*="googletagmanager.com"]')).toHaveCount(0);
});

const QUESTIONS = [
  { link: 'electricity-wash-laundry', h1: 'Milloin pestään pyykit?' },
  { link: 'electricity-charge-ev', h1: 'Milloin ladataan auto?' },
  { link: 'electricity-sauna', h1: 'Milloin saunotaan?' },
];

for (const question of QUESTIONS) {
  test(`${question.h1} answers from the price page`, async ({ page }) => {
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

test('the public API answers through milloin.xyz/api', async ({ request, baseURL }) => {
  // The /api rewrites are Vercel's, so a local server render has none
  test.skip(baseURL?.includes('localhost') ?? true, 'needs a Vercel deployment');
  const response = await request.get('/api/openapi.json');
  expect(response.ok()).toBe(true);
  expect((await response.json()).openapi).toMatch(/^3\./);
});
