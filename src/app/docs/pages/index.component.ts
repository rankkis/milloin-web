import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodeBlockComponent } from '../code-block.component';
import { DOCS_CATEGORIES, docsLink } from '../docs-categories';
import { API_BASE } from './docs-samples';

const ERROR_RESPONSE = `HTTP/1.1 400 Bad Request
Content-Type: application/problem+json

{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "durationHours must not be greater than 24",
  "errors": [{ "field": "durationHours", "message": "durationHours must not be greater than 24" }]
}`;

/** /docs: the API's categories to choose from, and what every category shares: times, limits and errors */
@Component({
  selector: 'app-docs-index',
  imports: [RouterLink, CodeBlockComponent],
  template: `
    <h1>milloin.xyz API</h1>
    <p class="lead">
      The answers of <a href="https://milloin.xyz" data-test-id="docs-index-site">milloin.xyz</a> to everyday "when"
      questions, as a public API. Free to use, no API key or sign-up.
    </p>

    <h2>Choose a category</h2>
    <p>
      The API is grouped by category, like the questions on milloin.xyz. Each category has its own guides, examples and
      API reference.
    </p>
    <ul class="categories">
      @for (category of categories; track category.path) {
        <li>
          <a class="category" [routerLink]="'/docs/' + category.path" [attr.data-test-id]="'docs-choose-' + category.path">
            <span class="category__title">{{ category.label }}</span>
            <span class="category__summary">{{ category.summary }}</span>
            <code class="category__path">{{ category.apiPrefix }}</code>
          </a>
          <span class="category__pages">
            @for (page of category.pages.slice(1); track page.path) {
              <a
                [routerLink]="link(category, page)"
                [attr.data-test-id]="'docs-choose-' + category.path + '-' + page.path"
                >{{ page.label }}</a
              >
            }
          </span>
        </li>
      }
    </ul>

    <h2>Basics</h2>
    <ul>
      <li>Every endpoint is under <code>{{ base }}</code>, its path starting with the category: <code>{{ base }}/v1/electricity/prices</code>.</li>
      <li>Responses are JSON. Times in them are UTC (ISO 8601, <code>Z</code>). Requests may give a UTC offset, such as <code>2026-10-13T07:00:00+03:00</code>; write the <code>+</code> as <code>%2B</code> in a URL (a plain <code>+</code> also works).</li>
      <li>The OpenAPI document of every category is at <a [href]="base + '/openapi.json'" data-test-id="docs-index-openapi">{{ base }}/openapi.json</a>, for generating a client.</li>
    </ul>

    <h2>Limits and caching</h2>
    <p>
      GET responses carry <code>Cache-Control</code>, and repeated requests are answered from the CDN. Requests that
      reach the server count against 60 a minute for each IP address; over that the API answers
      <code>429 Too Many Requests</code> with <code>Retry-After</code>. Any website may call the API from the browser
      (CORS). A link back to milloin.xyz is appreciated.
    </p>
    <p>
      For higher volumes, guaranteed availability or your own endpoints, write to
      <a href="mailto:jarkko.peltola@hurlumhei.xyz" data-test-id="docs-index-contact">jarkko.peltola&#64;hurlumhei.xyz</a>.
    </p>

    <h2>Errors</h2>
    <p>Every error is <code>application/problem+json</code>; a validation error lists the fields that failed.</p>
    <app-code-block [code]="errorResponse" />
  `,
  styleUrl: '../docs-page.scss',
  styles: `
    .categories {
      display: grid;
      gap: var(--space-3);
      max-width: none;
      padding: 0;
      list-style: none;

      li + li {
        margin-top: 0;
      }
    }

    .category {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      padding: var(--space-4);
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      color: inherit;
      text-decoration: none;

      &:hover,
      &:focus-visible {
        border-color: var(--color-accent);
      }
    }

    .category__title {
      font-size: 18px;
      font-weight: 500;
      color: var(--color-accent);
    }

    .category__summary {
      color: var(--color-text-muted);
    }

    .category__path {
      font-size: 13px;
      color: var(--color-text-muted);
    }

    .category__pages {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1) var(--space-4);
      padding: var(--space-2) var(--space-4) 0;
      font-size: 14px;
    }

    @media (min-width: 768px) {
      .categories {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `,
})
export class DocsIndexComponent {
  readonly base = API_BASE;
  readonly categories = DOCS_CATEGORIES;
  readonly errorResponse = ERROR_RESPONSE;
  readonly link = docsLink;
}
