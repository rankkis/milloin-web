import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IconComponent } from '../shared/icon/icon.component';
import { DOCS_CATEGORIES } from './docs-categories';

/** Developer docs for the public API (/docs), in English: the category menu and the page */
@Component({
  selector: 'app-docs',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, IconComponent],
  template: `
    <div class="docs" lang="en">
      <header class="header">
        <a class="back" routerLink="/" data-test-id="docs-home">
          <app-icon name="back" [size]="18" />
          milloin.xyz
        </a>
        <p class="label">Developer docs</p>
      </header>
      <nav class="categories" aria-label="API categories">
        <a
          class="categories__link"
          routerLink="/docs"
          routerLinkActive="categories__link--active"
          [routerLinkActiveOptions]="{ exact: true }"
          ariaCurrentWhenActive="page"
          data-test-id="docs-category-all"
          >All categories</a
        >
        @for (category of categories; track category.path) {
          <a
            class="categories__link"
            [routerLink]="'/docs/' + category.path"
            routerLinkActive="categories__link--active"
            [attr.data-test-id]="'docs-category-' + category.path"
            >{{ category.label }}</a
          >
        }
      </nav>
      <main class="main">
        <router-outlet />
      </main>
      <footer class="footer">
        © 2025 hurlumhei oy ·
        <a class="footer__link" href="mailto:jarkko.peltola@hurlumhei.xyz" data-test-id="docs-contact">Contact</a>
      </footer>
    </div>
  `,
  styleUrl: './docs.component.scss',
})
export class DocsComponent {
  readonly categories = DOCS_CATEGORIES;
}
