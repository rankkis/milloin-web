import { Component, input } from '@angular/core';

/**
 * Spinning ring shown while prices load. Sized by the font size of where it
 * sits, so it takes the place of the value it stands in for. With a label it
 * is a status message for screen readers; without one it is decorative.
 */
@Component({
  selector: 'app-spinner',
  template: `
    <svg class="ring" viewBox="0 0 24 24" aria-hidden="true">
      <circle class="track" cx="12" cy="12" r="10" />
      <circle class="arc" cx="12" cy="12" r="10" pathLength="100" />
    </svg>
    @if (label()) {
      <span class="label">{{ label() }}</span>
    }
  `,
  styleUrl: './spinner.component.scss',
  host: {
    '[attr.role]': 'label() ? "status" : null',
    '[attr.aria-hidden]': 'label() ? null : "true"',
  },
})
export class SpinnerComponent {
  /** Read by screen readers; empty when something nearby already says it */
  readonly label = input('Ladataan hintoja');
}
