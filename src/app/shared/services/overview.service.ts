import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { V1PricesDto } from '../models/api-v1.model';
import { hourlyPrices } from '../models/price-windows';
import {
  HourlyPriceDto,
  OptimalTimeDto,
  PriceCategory,
  PricePointDto,
} from '../models/price.model';
import { PricesService, apiError } from './prices.service';

export type { HourlyPriceDto, OptimalTimeDto, PriceCategory, PricePointDto };

export interface CurrentPriceDto {
  price: number;
  priceCategory: PriceCategory;
}

export interface OverviewDto {
  current: CurrentPriceDto;
  /** Hourly prices from the start of the current hour to the last published price */
  upcomingHours: HourlyPriceDto[];
}

const HOUR_MS = 60 * 60 * 1000;

/** The price now and the hours from the current one on */
export function toOverview(response: V1PricesDto): OverviewDto {
  const currentHour = Math.floor(Date.parse(response.current.startTime) / HOUR_MS) * HOUR_MS;
  return {
    current: { price: response.current.price, priceCategory: response.current.category },
    upcomingHours: hourlyPrices(response.prices, currentHour),
  };
}

@Injectable({
  providedIn: 'root'
})
export class OverviewService {
  private readonly prices = inject(PricesService);

  getOverview(): Observable<OverviewDto> {
    return this.prices.getPrices().pipe(
      map(toOverview),
      catchError(apiError('OverviewService', 'Yleiskatsauksen lataaminen epäonnistui')),
    );
  }
}
