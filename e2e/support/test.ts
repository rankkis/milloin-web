import { test as base } from '@playwright/test';

export { expect } from '@playwright/test';
export type { Page } from '@playwright/test';

/** Lets the tests through Vercel Deployment Protection on previews */
const bypassSecret = process.env['VERCEL_AUTOMATION_BYPASS_SECRET'];
const bypassHeaders: Record<string, string> = bypassSecret ? { 'x-vercel-protection-bypass': bypassSecret } : {};

/**
 * The bypass reaches only the deployment. API requests send it as a header
 * (a bypass cookie would answer with a 307 that hides the site's own
 * redirects). Pages get Vercel's bypass cookie instead: a header on every
 * browser request would also go to other origins, such as a CDN, and fail
 * their CORS checks.
 */
export const test = base.extend({
  request: async ({ playwright, baseURL }, use) => {
    const request = await playwright.request.newContext({ baseURL, extraHTTPHeaders: bypassHeaders });
    await use(request);
    await request.dispose();
  },
  context: async ({ context }, use) => {
    if (bypassSecret) {
      // The context's request shares its cookies with the pages
      await context.request.get('/', {
        headers: { ...bypassHeaders, 'x-vercel-set-bypass-cookie': 'true' },
        maxRedirects: 0,
      });
    }
    await use(context);
  },
});
