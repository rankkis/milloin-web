import { Component, computed, input } from '@angular/core';
import { HourlyPriceDto } from '../models/price.model';
import { formatNumber, formatPrice } from '../format/format';
import { IconComponent } from '../icon/icon.component';

type Trend = 'down' | 'up' | 'flat';

interface TrendTile {
  label: string;
  value: string;
  change: string;
  trend: Trend;
}

/** Windows that get a tile, in hours from the current hour */
const WINDOW_HOURS = [6, 12, 24];
/** Below this current price (c/kWh) a percentage says little; show the difference instead */
const MIN_PRICE_FOR_PCT = 0.5;

/**
 * Average price over the next 6, 12 and 24 hours compared with the current
 * price. A tile is left out when the prices don't cover its window.
 */
@Component({
  selector: 'app-trend-tiles',
  imports: [IconComponent],
  template: `
    @for (tile of tiles(); track tile.label) {
      <div class="tile">
        <p class="tile__label">{{ tile.label }}</p>
        <p class="tile__value">{{ tile.value }} <span class="tile__unit">c/kWh</span></p>
        <p [class]="'tile__change tile__change--' + tile.trend">
          @if (tile.trend === 'down') {
            <app-icon name="trend-down" [size]="14" />
          } @else if (tile.trend === 'up') {
            <app-icon name="trend-up" [size]="14" />
          }
          {{ tile.change }}
        </p>
      </div>
    }
  `,
  styleUrl: './trend-tiles.component.scss',
})
export class TrendTilesComponent {
  /** Hourly prices, starting with the current hour */
  readonly hours = input.required<HourlyPriceDto[]>();
  /** Current price in c/kWh */
  readonly current = input.required<number>();

  readonly tiles = computed<TrendTile[]>(() => {
    const hours = this.hours();
    const current = this.current();

    return WINDOW_HOURS.filter((count) => hours.length >= count).map((count) => {
      const window = hours.slice(0, count);
      const avg = window.reduce((sum, hour) => sum + hour.priceAvg, 0) / count;
      return { label: `+${count} h keskihinta`, value: formatPrice(avg), ...compare(avg, current) };
    });
  });
}

/** Change from the current price, e.g. −5 % vs. nyt */
function compare(avg: number, current: number): { change: string; trend: Trend } {
  if (Math.abs(current) < MIN_PRICE_FOR_PCT) {
    const diff = Math.round((avg - current) * 100) / 100;
    return {
      change: `${sign(diff)}${formatPrice(Math.abs(diff))} c vs. nyt`,
      trend: trendOf(diff),
    };
  }

  const pct = Math.round(((avg - current) / Math.abs(current)) * 100);
  return { change: `${sign(pct)}${formatNumber(Math.abs(pct), 0)} % vs. nyt`, trend: trendOf(pct) };
}

const sign = (value: number): string => (value < 0 ? '−' : value > 0 ? '+' : '');
const trendOf = (value: number): Trend => (value < 0 ? 'down' : value > 0 ? 'up' : 'flat');
