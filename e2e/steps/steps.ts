import { Page, expect } from '@playwright/test';
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

Then('the questions are {string}', async ({ page }, list: string) => {
  await expect(page.locator('.question__text')).toHaveText(list.split(', '));
});

Then('every question has an answer', async ({ page }) => {
  const answers = page.locator('.question__answer');
  await expect(answers.first()).toBeVisible();
  // The answers replace the loading spinners; "–" would mean no answer
  await expect(page.locator('.question__answer app-spinner')).toHaveCount(0);
  for (const answer of await answers.all()) await expect(answer).not.toHaveText('–');
});

Then('the page has no price chart', async ({ page }) => {
  await expect(page.locator('app-hourly-chart')).toHaveCount(0);
  await expect(page.locator('app-hourly-prices')).toHaveCount(0);
});

Then('the page shows the price now and the price chart', async ({ page }) => {
  await expect(page.locator('.now__value')).toHaveText(/^\s*-?\d+,\d{2}\s*$/);
  await expect(page.locator('app-hourly-chart')).toBeVisible();
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

const HOUR_MS = 60 * 60 * 1000;
/** The API the site reads its prices from */
const API_URL = 'https://milloin-server.vercel.app';

const finnishHour = new Intl.DateTimeFormat('fi-FI', { timeZone: 'Europe/Helsinki', hour: 'numeric', hourCycle: 'h23' });

/** The first 04:00 Finnish time after now: today's before 04:00, otherwise tomorrow's */
const nextFourAm = (now: Date): number => {
  let time = Math.floor(now.getTime() / HOUR_MS) * HOUR_MS + HOUR_MS;
  while (Number(finnishHour.format(new Date(time))) !== 4) time += HOUR_MS;
  return time;
};

Then('the EV charging answer starts by 04:00 the next morning', async ({ page }) => {
  const answer = page.getByTestId('ev-answer');
  await expect(answer).toHaveText(/^\d{2}:\d{2}–\d{2}:\d{2}$/);
  const start = Date.parse((await answer.getAttribute('data-start')) ?? '');
  expect(start).toBeLessThanOrEqual(nextFourAm(new Date()));
});

Then('a cheaper published window, if there is one, is compared at the bottom and marked in white', async ({ page }) => {
  const rows = page.locator('.comparison__row');
  await expect(rows.first()).toBeVisible();
  const cheapest = page.getByTestId('ev-compare-cheapest');
  const euros = async (row: typeof rows) =>
    Number(((await row.locator('.comparison__cost').textContent()) ?? '').replace(/[^\d,]/g, '').replace(',', '.'));
  if ((await cheapest.count()) === 0) {
    // No cheaper window: the current hour is white and nothing else
    await expect(page.locator('.bar--secondary')).toHaveCount(0);
    await expect(page.locator('.bar--current')).toHaveCount(1);
    return;
  }
  await expect(rows.last()).toHaveAttribute('data-test-id', 'ev-compare-cheapest');
  expect(await euros(cheapest)).toBeLessThanOrEqual(await euros(page.getByTestId('ev-compare-answer')));
  await expect(page.locator('.bar--current')).toHaveCount(0);
  await expect(page.locator('.bar--secondary').first()).toBeVisible();
});

Then('the chart {string} has a bar for every hour until the last published price', async ({ page, request }, testId: string) => {
  const bars = page.getByTestId(testId).locator('.bar');
  await expect(bars.first()).toBeVisible();
  // The same request the page makes, so the API's cache answers both alike
  const prices = await (await request.get(`${API_URL}/v1/electricity/prices`)).json();
  const until = Date.parse(prices.meta.pricesUntil);
  // Hours from the current one to the last published price; the hour may turn meanwhile
  const hoursLeft = Math.ceil((until - Math.floor(Date.now() / HOUR_MS) * HOUR_MS) / HOUR_MS);
  expect([hoursLeft, hoursLeft + 1]).toContain(await bars.count());
});

/** What a deployment answers for a chunk of an earlier build: its not-found page */
const goneChunk = { status: 404, contentType: 'text/html', body: '<!doctype html><title>Sivua ei löytynyt</title>' };
/** Set on the loaded page, so a step can tell whether the site was loaded again */
const SAME_PAGE_MARKER = '__milloinSamePage';

Given("I open {string} and every page's code has loaded", async ({ page }, path: string) => {
  await page.goto(path);
  // The site loads every page's code once the first page is shown
  await page.waitForLoadState('networkidle');
  await page.evaluate((marker) => ((window as unknown as Record<string, boolean>)[marker] = true), SAME_PAGE_MARKER);
});

Given('a new build is deployed', async ({ page }) => {
  await page.route(/\/chunk-[^/]*\.js$/, (route) => route.fulfill(goneChunk));
});

Given('a deploy removed the code of {string} before it was loaded', async ({ page }, selector: string) => {
  // The first request for the chunk that defines the component is answered as
  // after a deploy; a page loaded again from the server gets it
  const definesComponent = new RegExp(`selectors:\\[\\[.${selector}.\\]\\]`);
  let refused = false;
  await page.route(/\/chunk-[^/]*\.js$/, async (route) => {
    if (refused) return route.fallback();
    const response = await route.fetch();
    if (!refused && definesComponent.test(await response.text())) {
      refused = true;
      await route.fulfill(goneChunk);
    } else {
      await route.fulfill({ response });
    }
  });
});

const isSamePage = (page: Page): Promise<boolean> =>
  page.evaluate((marker) => (window as unknown as Record<string, boolean>)[marker] === true, SAME_PAGE_MARKER);

Then('the site was not loaded again', async ({ page }) => {
  expect(await isSamePage(page)).toBe(true);
});

Then('the site was loaded again from the server', async ({ page }) => {
  expect(await isSamePage(page)).toBe(false);
});

const FORECAST_URL = /\/v1\/electricity\/forecasts\/72h$/;

Given("milloin.xyz's forecast reaches {int} hours past the published prices", async ({ page, request }, hours: number) => {
  // The same request the page makes, so the API's cache answers both alike
  const prices = await (await request.get(`${API_URL}/v1/electricity/prices`)).json();
  const until = Date.parse(prices.meta.pricesUntil);
  // Six hours the forecaster had already published, which the page must not show as estimates
  const points = Array.from({ length: hours + 6 }, (_, index) => {
    const start = until + (index - 6) * HOUR_MS;
    return {
      startTime: new Date(start).toISOString(),
      endTime: new Date(start + HOUR_MS).toISOString(),
      price: 4 + (index % 5),
      priceEurMwh: 30,
      published: start < until,
    };
  });
  const forecast = { horizon: '72h', resolution: 'hour', issuedAt: new Date().toISOString(), modelVersion: 'e2e', change: 'e2e', points };
  await page.route(FORECAST_URL, (route) => route.fulfill({ json: forecast }));
});

Given("milloin.xyz's forecast is unavailable", async ({ page }) => {
  await page.route(FORECAST_URL, (route) =>
    route.fulfill({ status: 503, contentType: 'application/problem+json', json: { status: 503, title: 'Service Unavailable' } }),
  );
});

Then('the chart ends with {int} striped estimate bars', async ({ page }, count: number) => {
  const bars = page.getByTestId('electricity-chart').locator('.bar');
  await expect(bars.and(page.locator('.bar--estimate'))).toHaveCount(count);
  const total = await bars.count();
  await expect(bars.nth(total - count)).toHaveClass(/bar--estimate/);
  await expect(bars.nth(total - count - 1)).not.toHaveClass(/bar--estimate/);
});

const estimateButtons = (page: Page) => page.getByTestId('hourly-prices-show-estimates');

Then('the hourly price tables hide the estimated hours behind {string}', async ({ page }, label: string) => {
  await expect(estimateButtons(page).first()).toContainText(label);
  await expect(page.getByTestId('hourly-prices-estimate')).toHaveCount(0);
  await expect(page.locator('app-hourly-prices .note')).toContainText('milloin.xyz:n oma ennuste');
});

/** Clicks the one button that opens or closes every estimated hour */
const toggleEstimates = async (page: Page, expanded: boolean) => {
  const button = estimateButtons(page);
  await expect(button).toHaveCount(1);
  await expect(button).toHaveAttribute('aria-expanded', String(expanded));
  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', String(!expanded));
};

When('I open the estimated hours in the tables', async ({ page }) => {
  await toggleEstimates(page, false);
});

When('I close the estimated hours in the tables', async ({ page }) => {
  await toggleEstimates(page, true);
});

Then('the hourly price tables list {int} estimated hours in grey, without a tag on each row', async ({ page }, count: number) => {
  const rows = page.getByTestId('hourly-prices-estimate');
  await expect(rows).toHaveCount(count);
  await expect(rows.first()).toHaveClass(/estimate/);
  await expect(rows.first().locator('th')).toHaveText(/^\s*\d{2}:\d{2}–\d{2}:\d{2}\s*$/);
});

Then('the forecast note says the estimates are made by milloin.xyz, without a contact', async ({ page }) => {
  const note = page.getByTestId('electricity-forecast-note');
  await expect(note).toContainText('milloin.xyz:n oma ennuste tunneille, joiden pörssihintaa ei ole vielä julkaistu.');
  await expect(note).not.toContainText('pidemmän ennusteen');
  await expect(note.locator('a')).toHaveCount(0);
});

Then('the page shows no estimates', async ({ page }) => {
  await expect(page.locator('.bar--estimate')).toHaveCount(0);
  await expect(page.getByTestId('hourly-prices-estimate')).toHaveCount(0);
  await expect(page.getByTestId('electricity-forecast-note')).toHaveCount(0);
});
