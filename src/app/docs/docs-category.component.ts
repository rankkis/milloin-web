import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DocsCategory, docsCategory, docsLink } from './docs-categories';

/** A category of the docs (/docs/electricity, /docs/misc): its pages' menu and the page */
@Component({
  selector: 'app-docs-category',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <nav class="nav" [attr.aria-label]="category.label">
      @for (page of category.pages; track page.path) {
        <a
          class="nav__link"
          [routerLink]="link(page)"
          routerLinkActive="nav__link--active"
          [routerLinkActiveOptions]="{ exact: true }"
          ariaCurrentWhenActive="page"
          [attr.data-test-id]="page.testId"
          >{{ page.label }}</a
        >
      }
    </nav>
    <router-outlet />
  `,
  styleUrl: './docs-category.component.scss',
})
export class DocsCategoryComponent {
  readonly category = docsCategory(inject(ActivatedRoute).snapshot.data['docsCategory']) as DocsCategory;

  link(page: DocsCategory['pages'][number]): string {
    return docsLink(this.category, page);
  }
}
