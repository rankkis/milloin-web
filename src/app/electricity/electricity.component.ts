import { Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NgTemplateOutlet } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { APP_NAVIGATION_PATHS } from '../app.paths';
import { HourlyChartComponent } from '../shared/hourly-chart/hourly-chart.component';
import { IconComponent } from '../shared/icon/icon.component';
import { TrendTilesComponent } from '../shared/trend-tiles/trend-tiles.component';
import { resourceErrorMessage } from '../shared/resource-error';
import { SpinnerComponent } from '../shared/spinner/spinner.component';
import { ElectricityAnswers } from './electricity-answers';
import { ConsentSettingsLinkComponent } from '../shared/consent/consent-settings-link.component';
import { HourlyPricesComponent } from './hourly-prices/hourly-prices.component';
import { PricesService } from '../shared/services/prices.service';
import { estimatedHours } from '../shared/models/forecast';
import { ForecastNoteComponent } from './forecast-note/forecast-note.component';

/**
 * The price page (/sahko-on-halpaa, "Milloin sähkö on halpaa?"): price now, hourly prices,
 * trend tiles, the electricity questions, the hourly prices as tables and a short
 * explainer of spot prices. After the last published price, the chart and the tables
 * go on with milloin.xyz's own forecast, marked as estimates.
 */
@Component({
  selector: 'app-electricity',
  imports: [NgTemplateOutlet, RouterLink, HourlyChartComponent, IconComponent, SpinnerComponent, TrendTilesComponent, ConsentSettingsLinkComponent, HourlyPricesComponent, ForecastNoteComponent],
  providers: [ElectricityAnswers],
  templateUrl: './electricity.component.html',
  styleUrl: './electricity.component.scss',
})
export class ElectricityComponent {
  private readonly answers = inject(ElectricityAnswers);
  private readonly router = inject(Router);
  private readonly prices = inject(PricesService);

  /**
   * The forecast loads in the browser only, so it never slows down or fails
   * the server render; the page works without it.
   */
  private readonly inBrowser = signal(false);
  readonly forecast = rxResource({
    params: () => this.inBrowser() || undefined,
    stream: () => this.prices.getForecast().pipe(catchError(() => of(undefined))),
  });

  /** The page the visitor came from in this app (home or the Sähkö category page); home when opened directly */
  readonly backUrl = computed(
    () => this.router.lastSuccessfulNavigation()?.previousNavigation?.finalUrl ?? '/',
  );

  readonly paths = APP_NAVIGATION_PATHS;
  readonly now = this.answers.now;
  readonly overview = this.answers.overview;
  readonly laundry = this.answers.laundry;
  readonly ev = this.answers.ev;
  readonly sauna = this.answers.sauna;
  readonly overviewData = this.answers.overviewData;
  readonly date = this.answers.date;
  readonly current = this.answers.current;
  readonly tone = this.answers.tone;
  readonly upcoming = this.answers.upcoming;
  readonly laundryAnswer = this.answers.laundryAnswer;
  readonly evAnswer = this.answers.evAnswer;
  readonly saunaAnswer = this.answers.saunaAnswer;

  /** Forecast hours after the last published price */
  readonly estimates = computed(() => {
    const upcoming = this.upcoming();
    const last = upcoming[upcoming.length - 1];
    if (!last) return [];
    return estimatedHours(this.forecast.hasValue() ? this.forecast.value() : undefined, Date.parse(last.endTime));
  });

  /** Published hours from now on, then the estimated ones */
  readonly hours = computed(() => [...this.upcoming(), ...this.estimates()]);

  constructor() {
    afterNextRender(() => this.inBrowser.set(true));
  }

  reload(): void {
    this.answers.reload();
    this.forecast.reload();
  }

  readonly errorMessage = resourceErrorMessage;
}
