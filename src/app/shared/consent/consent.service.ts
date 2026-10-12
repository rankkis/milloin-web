import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

/**
 * Whether the consent banner and the footers' "Evästeasetukset" are shown.
 * Off while the site sets no cookies (Vercel Web Analytics is cookieless);
 * turn on, with the banner text and accept() updated, when ads are added.
 */
export const CONSENT_BANNER_ENABLED = false;
export const CONSENT_STORAGE_KEY = 'milloin-analytics-consent';

export type ConsentChoice = 'granted' | 'denied';

/**
 * The visitor's consent choice, kept in localStorage; the banner opens again
 * from the footer's "Evästeasetukset". Browser only: call init() after the
 * first render.
 */
@Injectable({ providedIn: 'root' })
export class ConsentService {
  private readonly document = inject(DOCUMENT);

  /** Whether the banner is in use (CONSENT_BANNER_ENABLED; tests override it) */
  enabled = CONSENT_BANNER_ENABLED;
  /** The stored choice; null until the visitor has chosen */
  readonly choice = signal<ConsentChoice | null>(null);
  /** Whether the consent banner is shown */
  readonly bannerOpen = signal(false);

  /** Applies the stored choice, or opens the banner when there is none */
  init(): void {
    this.deleteGoogleAnalyticsCookies();
    if (!this.enabled) return;
    const stored = this.read();
    this.choice.set(stored);
    if (stored === null) this.bannerOpen.set(true);
  }

  accept(): void {
    this.save('granted');
  }

  reject(): void {
    this.save('denied');
  }

  /** Opens the banner to change an earlier choice */
  openSettings(): void {
    if (this.enabled) this.bannerOpen.set(true);
  }

  private save(choice: ConsentChoice): void {
    this.choice.set(choice);
    this.bannerOpen.set(false);
    try {
      this.document.defaultView?.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
    } catch {
      // Storage blocked: the choice holds for this visit only
    }
  }

  private read(): ConsentChoice | null {
    try {
      const value = this.document.defaultView?.localStorage.getItem(CONSENT_STORAGE_KEY);
      return value === 'granted' || value === 'denied' ? value : null;
    } catch {
      return null;
    }
  }

  /** Removes the _ga cookies left by Google Analytics, which the site used until October 2026 */
  private deleteGoogleAnalyticsCookies(): void {
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
}
