import { Component, DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, TitleStrategy, provideRouter } from '@angular/router';
import { SeoTitleStrategy } from './seo-title-strategy';

@Component({ template: '' })
class BlankComponent {}

describe('SeoTitleStrategy', () => {
  let router: Router;
  let document: Document;

  const meta = (selector: string) =>
    document.head.querySelector<HTMLMetaElement>(`meta[${selector}]`)?.content;
  const canonical = () =>
    document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'page', component: BlankComponent, title: 'Page title', data: { description: 'Page description' } },
          { path: '**', component: BlankComponent, title: 'Not found', data: { noindex: true } },
        ]),
        { provide: TitleStrategy, useClass: SeoTitleStrategy },
      ],
    });
    router = TestBed.inject(Router);
    document = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    document.head.querySelector('link[rel="canonical"]')?.remove();
    document.head.querySelector('meta[name="robots"]')?.remove();
  });

  it('sets the title, description, canonical and Open Graph tags of the page', async () => {
    await router.navigateByUrl('/page?from=test');

    expect(document.title).toBe('Page title');
    expect(meta('name="description"')).toBe('Page description');
    expect(meta('property="og:title"')).toBe('Page title');
    expect(meta('property="og:url"')).toBe('https://milloin.xyz/page');
    expect(canonical()).toBe('https://milloin.xyz/page');
    expect(meta('name="robots"')).toBeUndefined();
  });

  it('keeps unknown pages out of search results', async () => {
    await router.navigateByUrl('/page');
    await router.navigateByUrl('/no-such-page');

    expect(document.title).toBe('Not found');
    expect(meta('name="robots"')).toBe('noindex');
    expect(canonical()).toBeUndefined();
  });
});
