import { startAnalytics } from './analytics';

describe('startAnalytics', () => {
  it('loads nothing in development', () => {
    startAnalytics(window);
    expect(document.querySelector('script[src*="/_vercel/insights"]')).toBeNull();
  });
});
