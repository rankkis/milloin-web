import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy } from '@angular/router';

export const SITE_URL = 'https://milloin.xyz';

/** Per-page SEO data, given in a route's `data` next to its `title` */
export interface SeoRouteData {
  description?: string;
  /** Keep the page out of search results (the not-found page) */
  noindex?: boolean;
}

/**
 * Sets the title, description, canonical URL and Open Graph tags of each page
 * from its route, so the pages don't all share the home page's tags.
 */
@Injectable({ providedIn: 'root' })
export class SeoTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const title = this.buildTitle(snapshot);
    const data = deepestChild(snapshot.root).data as SeoRouteData;
    const url = SITE_URL + snapshot.url.split(/[?#]/)[0];

    if (title) {
      this.title.setTitle(title);
      this.meta.updateTag({ property: 'og:title', content: title });
      this.meta.updateTag({ name: 'twitter:title', content: title });
    }
    if (data.description) {
      this.meta.updateTag({ name: 'description', content: data.description });
      this.meta.updateTag({ property: 'og:description', content: data.description });
      this.meta.updateTag({ name: 'twitter:description', content: data.description });
    }

    if (data.noindex) {
      this.meta.updateTag({ name: 'robots', content: 'noindex' });
      this.canonicalLink()?.remove();
    } else {
      this.meta.removeTag('name="robots"');
      this.meta.updateTag({ property: 'og:url', content: url });
      this.ensureCanonicalLink().href = url;
    }
  }

  private canonicalLink(): HTMLLinkElement | null {
    return this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  }

  private ensureCanonicalLink(): HTMLLinkElement {
    let link = this.canonicalLink();
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }
    return link;
  }
}

function deepestChild(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
  return route.firstChild ? deepestChild(route.firstChild) : route;
}
