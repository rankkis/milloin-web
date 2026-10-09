import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export const GA_MEASUREMENT_ID = 'G-4J2DJ7V1SE';
export const CONSENT_STORAGE_KEY = 'milloin-analytics-consent';

export type ConsentChoice = 'granted' | 'denied';

type Gtag = (...args: unknown[]) => void;
type AnalyticsWindow = Window & { dataLayer?: unknown[]; gtag?: Gtag };

/**
 * Consent to Google Analytics. Nothing is loaded and no cookie is set until
 * the visitor accepts; the choice is kept in localStorage, and the banner
 * opens again from the footer's "Evästeasetukset". Browser only: call
 * init() after the first render.
 */
@Injectable({ providedIn: 'root' })
export class ConsentService {
  private readonly document = inject(DOCUMENT);
  private analyticsLoaded = false;

  /** The stored choice; null until the visitor has chosen */
  readonly choice = signal<ConsentChoice | null>(null);
  /** Whether the consent banner is shown */
  readonly bannerOpen = signal(false);

  /** Applies the stored choice, or opens the banner when there is none */
  init(): void {
    const stored = this.read();
    this.choice.set(stored);
    if (stored === 'granted') this.loadAnalytics();
    if (stored === null) this.bannerOpen.set(true);
  }

  accept(): void {
    this.save('granted');
    this.loadAnalytics();
    this.gtag()?.('consent', 'update', { analytics_storage: 'granted' });
  }

  reject(): void {
    this.save('denied');
    if (this.analyticsLoaded) {
      this.gtag()?.('consent', 'update', { analytics_storage: 'denied' });
      this.deleteAnalyticsCookies();
    }
  }

  /** Opens the banner to change an earlier choice */
  openSettings(): void {
    this.bannerOpen.set(true);
  }

  private save(choice: ConsentChoice): void {
    this.choice.set(choice);
    this.bannerOpen.set(false);
    try {
      this.window()?.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
    } catch {
      // Storage blocked: the choice holds for this visit only
    }
  }

  private read(): ConsentChoice | null {
    try {
      const value = this.window()?.localStorage.getItem(CONSENT_STORAGE_KEY);
      return value === 'granted' || value === 'denied' ? value : null;
    } catch {
      return null;
    }
  }

  /** Google tag with Consent Mode v2: analytics granted, ads always denied */
  private loadAnalytics(): void {
    const win = this.window();
    if (this.analyticsLoaded || !win) return;
    this.analyticsLoaded = true;

    win.dataLayer = win.dataLayer || [];
    const dataLayer = win.dataLayer;
    win.gtag = function gtag() {
      // gtag.js reads the arguments object, not an array
      // eslint-disable-next-line prefer-rest-params
      dataLayer.push(arguments);
    };
    win.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    win.gtag('js', new Date());
    win.gtag('config', GA_MEASUREMENT_ID);

    const script = this.document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    this.document.head.appendChild(script);
  }

  /** Removes the _ga cookies Google Analytics set before consent was withdrawn */
  private deleteAnalyticsCookies(): void {
    const host = this.document.location?.hostname ?? '';
    const domains = ['', host, `.${host.replace(/^www\./, '')}`];
    for (const cookie of this.document.cookie.split(';')) {
      const name = cookie.split('=')[0].trim();
      if (!name.startsWith('_ga')) continue;
      for (const domain of domains) {
        const domainPart = domain ? `; domain=${domain}` : '';
        this.document.cookie = `${name}=; max-age=0; path=/${domainPart}`;
      }
    }
  }

  private window(): AnalyticsWindow | null {
    return this.document.defaultView as AnalyticsWindow | null;
  }

  private gtag(): Gtag | undefined {
    return this.window()?.gtag;
  }
}
