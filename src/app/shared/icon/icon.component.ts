import { Component, input } from '@angular/core';

export type IconName = 'washer' | 'car' | 'back' | 'refresh';

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
        @case ('back') {
          <path d="M19 12H5M11 6l-6 6 6 6" />
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
