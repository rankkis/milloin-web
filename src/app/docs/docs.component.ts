import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IconComponent } from '../shared/icon/icon.component';

/** The pages of the developer docs, in the order the menu lists them */
export const DOCS_PAGES = [
  { path: '', label: 'Overview', testId: 'docs-nav-overview' },
  { path: 'home-assistant', label: 'Home Assistant', testId: 'docs-nav-home-assistant' },
  { path: 'presets', label: 'Presets', testId: 'docs-nav-presets' },
  { path: 'custom-plans', label: 'Custom plans', testId: 'docs-nav-custom-plans' },
  { path: 'reference', label: 'API reference', testId: 'docs-nav-reference' },
];

/** Developer docs for the public API (/docs), in English: menu and the page */
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
      <nav class="nav" aria-label="Docs">
        @for (page of pages; track page.path) {
          <a
            class="nav__link"
            [routerLink]="page.path ? '/docs/' + page.path : '/docs'"
            routerLinkActive="nav__link--active"
            [routerLinkActiveOptions]="{ exact: true }"
            ariaCurrentWhenActive="page"
            [attr.data-test-id]="page.testId"
            >{{ page.label }}</a
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
  readonly pages = DOCS_PAGES;
}
