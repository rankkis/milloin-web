import { Component, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { APP_NAVIGATION_PATHS } from '../app.paths';
import { HourlyChartComponent } from '../shared/hourly-chart/hourly-chart.component';
import { IconComponent } from '../shared/icon/icon.component';
import { TrendTilesComponent } from '../shared/trend-tiles/trend-tiles.component';
import { resourceErrorMessage } from '../shared/resource-error';
import { SpinnerComponent } from '../shared/spinner/spinner.component';
import { ElectricityAnswers } from './electricity-answers';
import { ConsentSettingsLinkComponent } from '../shared/consent/consent-settings-link.component';

/** The Sähkö category page: price now, hourly prices, trend tiles and the electricity questions */
@Component({
  selector: 'app-electricity',
  imports: [NgTemplateOutlet, RouterLink, HourlyChartComponent, IconComponent, SpinnerComponent, TrendTilesComponent, ConsentSettingsLinkComponent],
  providers: [ElectricityAnswers],
  templateUrl: './electricity.component.html',
  styleUrl: './electricity.component.scss',
})
export class ElectricityComponent {
  private readonly answers = inject(ElectricityAnswers);

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

  reload(): void {
    this.answers.reload();
  }

  readonly errorMessage = resourceErrorMessage;
}
