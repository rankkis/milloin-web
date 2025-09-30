import { Component, inject } from '@angular/core';
import { ChargeEvService, ChargeForecastDto } from './charge-ev.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { switchMap, map, catchError, startWith } from 'rxjs/operators';
import { PriceUtilitiesService } from '../shared/services/price-utilities.service';
import { PriceCategory, OptimalTimeDto } from '../shared/models/price.model';

interface ForecastState {
  loading: boolean;
  data: ChargeForecastDto | null;
  error: string | null;
}

@Component({
  selector: 'app-charge-ev',
  standalone: false,
  templateUrl: './charge-ev.component.html',
  styleUrl: './charge-ev.component.scss'
})
export class ChargeEvComponent {
  private readonly chargeEvService = inject(ChargeEvService);
  private readonly priceUtilities = inject(PriceUtilitiesService);
  private readonly trigger$ = new BehaviorSubject<void>(undefined);

  forecast$: Observable<ForecastState> = this.trigger$.pipe(
    switchMap(() =>
      this.chargeEvService.getForecast().pipe(
        map((data): ForecastState => ({ loading: false, data, error: null })),
        catchError((err): Observable<ForecastState> => {
          console.error('[ChargeEvComponent] Error fetching forecast:', err);

          const errorMessage = err.userMessage || 'Ennusteen lataaminen epäonnistui';

          return of({
            loading: false,
            data: null,
            error: errorMessage
          });
        }),
        startWith({ loading: true, data: null, error: null })
      )
    )
  );

  getForecast(): void {
    this.trigger$.next();
  }

  isCurrentlyOptimalTime(timeSlot: OptimalTimeDto): boolean {
    return this.priceUtilities.isCurrentlyOptimalTime(timeSlot);
  }

  getPriceCategoryText(category: PriceCategory): string {
    return this.priceUtilities.getPriceCategoryText(category);
  }

  shouldRecommendNow(timeSlot: OptimalTimeDto): boolean {
    return this.priceUtilities.shouldRecommendNow(timeSlot);
  }

  getPriceCssClass(category: PriceCategory): string {
    return this.priceUtilities.getPriceCssClass(category);
  }

  getPriceEmoji(category: PriceCategory): string {
    return this.priceUtilities.getPriceEmoji(category);
  }
}
