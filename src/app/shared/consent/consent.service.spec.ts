import { TestBed } from '@angular/core/testing';
import { CONSENT_STORAGE_KEY, ConsentService } from './consent.service';

type AnalyticsWindow = Window & { dataLayer?: unknown[]; gtag?: unknown };

describe('ConsentService', () => {
  const win = window as AnalyticsWindow;

  function gaScripts(): NodeListOf<HTMLScriptElement> {
    return document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]');
  }

  function cleanUp(): void {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    gaScripts().forEach((script) => script.remove());
    delete win.dataLayer;
    delete win.gtag;
  }

  beforeEach(() => {
    cleanUp();
    // Keep the tests from fetching gtag.js
    const append = document.head.appendChild.bind(document.head);
    spyOn(document.head, 'appendChild').and.callFake(<T extends Node>(node: T): T => {
      if (node instanceof HTMLScriptElement) node.removeAttribute('src');
      return append(node);
    });
  });

  afterEach(cleanUp);

  function create(): ConsentService {
    return TestBed.inject(ConsentService);
  }

  function loadedScript(): boolean {
    return (document.head.appendChild as jasmine.Spy).calls
      .allArgs()
      .some(([node]) => node instanceof HTMLScriptElement);
  }

  it('opens the banner and loads nothing before the visitor chooses', () => {
    const consent = create();
    consent.init();

    expect(consent.bannerOpen()).toBeTrue();
    expect(consent.choice()).toBeNull();
    expect(loadedScript()).toBeFalse();
    expect(win.dataLayer).toBeUndefined();
  });

  it('loads Google Analytics with ads denied once accepted, and remembers it', () => {
    const consent = create();
    consent.init();
    consent.accept();

    expect(consent.bannerOpen()).toBeFalse();
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('granted');
    expect(loadedScript()).toBeTrue();
    const defaults = Array.from(win.dataLayer![0] as ArrayLike<unknown>);
    expect(defaults).toEqual([
      'consent',
      'default',
      { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' },
    ]);
  });

  it('keeps Google Analytics off when rejected, and remembers it', () => {
    const consent = create();
    consent.init();
    consent.reject();

    expect(consent.bannerOpen()).toBeFalse();
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('denied');
    expect(loadedScript()).toBeFalse();
  });

  it('applies an earlier acceptance without the banner', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'granted');
    const consent = create();
    consent.init();

    expect(consent.bannerOpen()).toBeFalse();
    expect(loadedScript()).toBeTrue();
  });

  it('applies an earlier rejection without the banner', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'denied');
    const consent = create();
    consent.init();

    expect(consent.bannerOpen()).toBeFalse();
    expect(loadedScript()).toBeFalse();
  });

  it('withdraws consent: denies analytics storage and removes the _ga cookies', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'granted');
    document.cookie = '_ga_TEST=1; path=/';
    const consent = create();
    consent.init();
    consent.openSettings();
    expect(consent.bannerOpen()).toBeTrue();

    consent.reject();

    const last = Array.from(win.dataLayer!.at(-1) as ArrayLike<unknown>);
    expect(last).toEqual(['consent', 'update', { analytics_storage: 'denied' }]);
    expect(document.cookie).not.toContain('_ga_TEST');
  });
});
