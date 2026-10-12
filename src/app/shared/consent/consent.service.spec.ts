import { TestBed } from '@angular/core/testing';
import { CONSENT_STORAGE_KEY, ConsentService } from './consent.service';

describe('ConsentService', () => {
  beforeEach(() => localStorage.removeItem(CONSENT_STORAGE_KEY));
  afterEach(() => localStorage.removeItem(CONSENT_STORAGE_KEY));

  function create(enabled = true): ConsentService {
    const consent = TestBed.inject(ConsentService);
    consent.enabled = enabled;
    return consent;
  }

  it('shows no banner while turned off', () => {
    const consent = create(false);
    consent.init();
    consent.openSettings();

    expect(consent.bannerOpen()).toBeFalse();
  });

  it('removes the _ga cookies Google Analytics left, even while turned off', () => {
    document.cookie = '_ga_TEST=1; path=/';
    create(false).init();

    expect(document.cookie).not.toContain('_ga_TEST');
  });

  it('opens the banner before the visitor chooses', () => {
    const consent = create();
    consent.init();

    expect(consent.bannerOpen()).toBeTrue();
    expect(consent.choice()).toBeNull();
  });

  it('remembers an acceptance', () => {
    const consent = create();
    consent.init();
    consent.accept();

    expect(consent.bannerOpen()).toBeFalse();
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('granted');
  });

  it('remembers a rejection', () => {
    const consent = create();
    consent.init();
    consent.reject();

    expect(consent.bannerOpen()).toBeFalse();
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('denied');
  });

  it('applies an earlier choice without the banner, and opens it again from the settings', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'granted');
    const consent = create();
    consent.init();

    expect(consent.bannerOpen()).toBeFalse();
    expect(consent.choice()).toBe('granted');
    consent.openSettings();
    expect(consent.bannerOpen()).toBeTrue();
  });
});
