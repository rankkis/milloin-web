import { Component, DOCUMENT, ElementRef, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { environment } from '../../../environments/environment';
import { API_BASE } from './docs-samples';

/** Scalar's standalone API reference, pinned with its hash so the CDN cannot change it */
const SCALAR_SRC = 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.72.0/dist/browser/standalone.js';
const SCALAR_INTEGRITY = 'sha384-OPr81V05YKGVtMFR7bgn6teWINJ+Qb5LIgvuAi2xv2C/5Y1/PcjZ0DrvpMdP39ix';

interface ScalarGlobal {
  createApiReference(element: Element, config: Record<string, unknown>): unknown;
}

/** /docs/reference: every endpoint and field from the OpenAPI document, drawn by Scalar in the browser */
@Component({
  selector: 'app-docs-reference',
  template: `
    <h1>API reference</h1>
    <p class="lead">
      Every endpoint, parameter and field, from the
      <a [href]="openApiUrl" data-test-id="docs-reference-openapi">OpenAPI document</a>. Try a request with
      the Test Request button.
    </p>
    @if (failed()) {
      <p class="note">The reference did not load. The <a [href]="openApiUrl" data-test-id="docs-reference-openapi-fallback">OpenAPI document</a> has the same content.</p>
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

  readonly openApiUrl = `${API_BASE}/openapi.json`;
  readonly failed = signal(false);

  constructor() {
    afterNextRender(() => {
      // Loaded once, on the first visit to this page
      if (this.scalar()) {
        this.render();
        return;
      }
      const script = this.document.createElement('script');
      script.src = SCALAR_SRC;
      script.integrity = SCALAR_INTEGRITY;
      script.crossOrigin = 'anonymous';
      script.onload = () => this.render();
      script.onerror = () => this.failed.set(true);
      this.document.head.appendChild(script);
    });
  }

  private scalar(): ScalarGlobal | undefined {
    return (this.document.defaultView as (Window & { Scalar?: ScalarGlobal }) | null)?.Scalar;
  }

  private render(): void {
    const scalar = this.scalar();
    if (!scalar) {
      this.failed.set(true);
      return;
    }
    scalar.createApiReference(this.reference().nativeElement, {
      // The server's own document, so previews and local runs show the API they call
      url: `${environment.apiUrl}/api-json`,
      forceDarkModeState: 'dark',
      hideDarkModeToggle: true,
      withDefaultFonts: false,
      hideClientButton: true,
      showDeveloperTools: 'never',
    });
  }
}
