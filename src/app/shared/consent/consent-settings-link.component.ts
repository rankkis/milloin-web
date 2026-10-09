import { Component, inject, input } from '@angular/core';
import { ConsentService } from './consent.service';

/** Footer button that opens the consent banner again */
@Component({
  selector: 'app-consent-settings-link',
  template: `<button type="button" class="link" [attr.data-test-id]="testId()" (click)="consent.openSettings()">Evästeasetukset</button>`,
  styles: `
    .link {
      padding: 0;
      font: inherit;
      color: inherit;
      text-decoration: underline;
      background: none;
      border: 0;
      cursor: pointer;

      &:hover,
      &:focus-visible {
        color: var(--color-text);
      }
    }
  `,
})
export class ConsentSettingsLinkComponent {
  protected readonly consent = inject(ConsentService);
  readonly testId = input.required<string>();
}
