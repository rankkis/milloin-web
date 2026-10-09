import { Component, computed, inject, input, output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IconComponent } from '../icon/icon.component';

/** Header of a question page: back to the previous page, current price and refresh */
@Component({
  selector: 'app-answer-header',
  imports: [RouterLink, IconComponent],
  template: `
    @if (previousUrl(); as previous) {
      <a class="back" [routerLink]="previous" data-test-id="answer-back">
        <app-icon name="back" [size]="18" />
        Takaisin
      </a>
    } @else {
      <a class="back" routerLink="/" data-test-id="answer-home">
        <app-icon name="home" [size]="18" />
        Koti
      </a>
    }
    <div class="end">
      @if (currentPrice(); as price) {
        <p class="price">nyt {{ price }} <span class="unit">c/kWh</span></p>
      }
      @if (refreshable()) {
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
      }
    </div>
  `,
  styleUrl: './answer-header.component.scss',
})
export class AnswerHeaderComponent {
  private readonly router = inject(Router);

  /** Current price, already formatted */
  readonly currentPrice = input<string>();
  readonly loading = input(false);
  /** False on pages with nothing to reload */
  readonly refreshable = input(true);
  readonly refresh = output<void>();

  /**
   * The page the visitor came from in this app (home or a category page);
   * undefined when the page was opened directly, also on the server render
   */
  readonly previousUrl = computed(
    () => this.router.lastSuccessfulNavigation()?.previousNavigation?.finalUrl ?? undefined,
  );
}
