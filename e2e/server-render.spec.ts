import { expect, test } from './support/test';

/**
 * The HTML the server sends, before any script runs: what search engines
 * and the first paint see.
 */
const PAGES = [
  { path: '/', h1: 'Milloin', prices: true },
  { path: '/sahkoa-kannattaa-kayttaa', h1: 'Sähkö', prices: true },
  { path: '/sahko-on-halpaa', h1: 'Sähkön hinta nyt', prices: true },
  { path: '/pestaan-pyykit', h1: 'Milloin pestään pyykit?', prices: true },
  { path: '/ladataan-auto', h1: 'Milloin ladataan auto?', prices: true },
  { path: '/saunotaan', h1: 'Milloin saunotaan?', prices: true },
  { path: '/raha-tulee-tilille', h1: 'Raha', prices: false },
  { path: '/kelan-tuet-maksetaan', h1: 'Milloin Kelan tuet maksetaan?', prices: false },
  { path: '/veronpalautukset-tulevat', h1: 'Milloin veronpalautukset tulevat?', prices: false },
  { path: '/elake-maksetaan', h1: 'Milloin eläke maksetaan?', prices: false },
];

const h1Of = (html: string): string | undefined =>
  html.match(/<h1[^>]*>([^<]*)/)?.[1].trim();

for (const page of PAGES) {
  test(`server renders ${page.path}`, async ({ request }) => {
    const response = await request.get(page.path);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(h1Of(html)).toBe(page.h1);
    expect(html).toContain('<link rel="canonical"');
    if (page.prices) {
      // Prices come from the API during the server render
      expect(html).toMatch(/\d+,\d{2} c\/kWh|\d+,\d+ snt|\d+,\d{2} €/);
    }
  });
}

test('unknown address answers 404', async ({ request }) => {
  const response = await request.get('/ei-ole-olemassa');
  expect(response.status()).toBe(404);
  expect(h1Of(await response.text())).toBe('Sivua ei löytynyt');
});

test('earlier addresses redirect to the new pages', async ({ request }) => {
  const response = await request.get('/kannattaa-pesta-pyykkia', { maxRedirects: 0 });
  expect([301, 308]).toContain(response.status());
  expect(response.headers()['location']).toMatch(/\/pestaan-pyykit$/);
});
