import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../icon/icon.component';

/** Header of a question page: back to home, current price and refresh */
@Component({
  selector: 'app-answer-header',
  imports: [RouterLink, IconComponent],
  template: `
    <a class="back" routerLink="/" data-test-id="answer-back">
      <app-icon name="back" [size]="18" />
      Takaisin
    </a>
    <div class="end">
      @if (currentPrice(); as price) {
        <p class="price">nyt {{ price }} <span class="unit">c/kWh</span></p>
      }
      <button
        type="button"
        class="refresh"
        aria-label="Päivitä"
        data-test-id="answer-refresh"
        [class.refresh--loading]="loading()"
        [disabled]="loading()"
        (click)="refresh.emit()"
      >
        <app-icon name="refresh" [size]="18" />
      </button>
    </div>
  `,
  styleUrl: './answer-header.component.scss',
})
export class AnswerHeaderComponent {
  /** Current price, already formatted */
  readonly currentPrice = input<string>();
  readonly loading = input(false);
  readonly refresh = output<void>();
}
