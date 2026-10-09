import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Pages are rendered on the server for every request, because they show the
 * price now. Vercel's CDN keeps a rendered page for a minute and serves a
 * stale one for up to 10 minutes while it renders a fresh one.
 */
const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=600',
};

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Server, headers: CACHE_HEADERS },
  { path: 'sahko-on-halpaa', renderMode: RenderMode.Server, headers: CACHE_HEADERS },
  { path: 'pestaan-pyykit', renderMode: RenderMode.Server, headers: CACHE_HEADERS },
  { path: 'ladataan-auto', renderMode: RenderMode.Server, headers: CACHE_HEADERS },
  { path: 'saunotaan', renderMode: RenderMode.Server, headers: CACHE_HEADERS },
  // Earlier addresses that redirect to the new ones
  { path: 'kannattaa-pesta-pyykkia', renderMode: RenderMode.Server, status: 301 },
  { path: 'kannattaa-ladata-auto', renderMode: RenderMode.Server, status: 301 },
  { path: '**', renderMode: RenderMode.Server, status: 404, headers: CACHE_HEADERS },
];
