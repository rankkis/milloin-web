import { Component, input } from '@angular/core';

export type IconName = 'washer' | 'car' | 'sauna' | 'back' | 'home' | 'forward' | 'chevron' | 'refresh' | 'trend-up' | 'trend-down' | 'calendar' | 'receipt' | 'coin';

/** Inline line icon. Decorative: label the surrounding control instead. */
@Component({
  selector: 'app-icon',
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      @switch (name()) {
        @case ('washer') {
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <circle cx="12" cy="13" r="4.5" />
          <path d="M8 6h.01M11 6h.01" />
        }
        @case ('car') {
          <path d="M5 17H3v-5l2-5h12l3 5h1v5h-2" />
          <circle cx="7.5" cy="17" r="2" />
          <circle cx="16.5" cy="17" r="2" />
          <path d="M9.5 17h5" />
        }
        @case ('sauna') {
          <path d="M8 3c-1 1.2-1 2.3 0 3.5s1 2.3 0 3.5M12 3c-1 1.2-1 2.3 0 3.5s1 2.3 0 3.5M16 3c-1 1.2-1 2.3 0 3.5s1 2.3 0 3.5" />
          <rect x="4" y="13" width="16" height="8" rx="1.5" />
          <path d="M4 17h16" />
        }
        @case ('calendar') {
          <rect x="4" y="5" width="16" height="16" rx="1.5" />
          <path d="M4 10h16M8 3v4M16 3v4M12 13.5v4M10 15.5h4" />
        }
        @case ('receipt') {
          <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
          <path d="M9 8h6M9 12h6M9 16h3" />
        }
        @case ('coin') {
          <circle cx="12" cy="12" r="9" />
          <path d="M14.5 9.5c0-1.2-1.1-2-2.5-2s-2.5.8-2.5 2 1.2 1.7 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2-2.5-.8-2.5-2M12 6v1.5M12 16.5V18" />
        }
        @case ('back') {
          <path d="M19 12H5M11 6l-6 6 6 6" />
        }
        @case ('home') {
          <path d="M4 11l8-7 8 7M6 9.5V20h4.5v-5h3v5H18V9.5" />
        }
        @case ('chevron') {
          <path d="M9 6l6 6-6 6" />
        }
        @case ('forward') {
          <path d="M5 12h14M13 6l6 6-6 6" />
        }
        @case ('trend-up') {
          <path d="M7 17 17 7M9 7h8v8" />
        }
        @case ('trend-down') {
          <path d="M7 7l10 10M17 9v8H9" />
        }
        @case ('refresh') {
          <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
    }
  `,
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input(20);
}
