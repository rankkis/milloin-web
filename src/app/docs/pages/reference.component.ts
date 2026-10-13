import { Component, DOCUMENT, ElementRef, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';
import { DocsCategory, docsCategory } from '../docs-categories';
import { openApiForCategory } from '../openapi-category';
import { API_BASE } from './docs-samples';

/** Scalar's standalone API reference, pinned with its hash so the CDN cannot change it */
const SCALAR_SRC = 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.72.0/dist/browser/standalone.js';
const SCALAR_INTEGRITY = 'sha384-OPr81V05YKGVtMFR7bgn6teWINJ+Qb5LIgvuAi2xv2C/5Y1/PcjZ0DrvpMdP39ix';

interface ScalarGlobal {
  createApiReference(element: Element, config: Record<string, unknown>): unknown;
}

/**
 * /docs/<category>/reference: the category's endpoints and fields from the OpenAPI document, drawn by Scalar
 * in the browser
 */
@Component({
  selector: 'app-docs-reference',
  template: `
    <h1>{{ category.label }} API reference</h1>
    <p class="lead">
      Every endpoint, parameter and field under <code>{{ category.apiPrefix }}</code>, from the
      <a [href]="openApiUrl" data-test-id="docs-reference-openapi">OpenAPI document</a>. Try a request with
      the Test Request button.
    </p>
    @if (failed()) {
      <p class="note">The reference did not load. The <a [href]="openApiUrl" data-test-id="docs-reference-openapi-fallback">OpenAPI document</a> has the same endpoints.</p>
    }
    <div #reference class="reference"></div>
  `,
  styleUrl: '../docs-page.scss',
  styles: `
    .reference {
      min-height: 60vh;
    }
  `,
})
export class DocsReferenceComponent {
  private readonly document = inject(DOCUMENT);
  private readonly reference = viewChild.required<ElementRef<HTMLElement>>('reference');

  /** The category, from the route of the category this page is under */
  readonly category = docsCategory(
    inject(ActivatedRoute).snapshot.pathFromRoot.find(route => route.data['docsCategory'])?.data['docsCategory'],
  ) as DocsCategory;
  readonly openApiUrl = `${API_BASE}/openapi.json`;
  readonly failed = signal(false);

  constructor() {
    afterNextRender(() => {
      // Loaded once, on the first visit to this page
      if (this.scalar()) {
        void this.render();
        return;
      }
      const script = this.document.createElement('script');
      script.src = SCALAR_SRC;
      script.integrity = SCALAR_INTEGRITY;
      script.crossOrigin = 'anonymous';
      script.onload = () => void this.render();
      script.onerror = () => this.failed.set(true);
      this.document.head.appendChild(script);
    });
  }

  /** The server's own document, so previews and local runs show the API they call, with only this category */
  private async categoryDocument(): Promise<Record<string, unknown> | undefined> {
    try {
      const response = await fetch(`${environment.apiUrl}/api-json`);
      if (!response.ok) return undefined;
      const document = openApiForCategory(await response.json(), this.category.apiPrefix);
      // The document's own introduction is about every category
      return {
        ...document,
        info: {
          ...(document['info'] as Record<string, unknown>),
          title: `milloin.xyz API: ${this.category.label}`,
          description: `${this.category.summary} Guides and examples: https://milloin.xyz/docs/${this.category.path}`,
        },
      };
    } catch {
      return undefined;
    }
  }

  private scalar(): ScalarGlobal | undefined {
    return (this.document.defaultView as (Window & { Scalar?: ScalarGlobal }) | null)?.Scalar;
  }

  private async render(): Promise<void> {
    const scalar = this.scalar();
    const content = scalar && (await this.categoryDocument());
    if (!scalar || !content) {
      this.failed.set(true);
      return;
    }
    scalar.createApiReference(this.reference().nativeElement, {
      content,
      forceDarkModeState: 'dark',
      hideDarkModeToggle: true,
      withDefaultFonts: false,
      hideClientButton: true,
      showDeveloperTools: 'never',
    });
  }
}
