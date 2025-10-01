import { Component, inject } from '@angular/core';
import { ChargeEvService, ChargeOptimalScheduleDto } from './charge-ev.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { switchMap, map, catchError, startWith } from 'rxjs/operators';
import { PriceUtilitiesService } from '../shared/services/price-utilities.service';
import { PriceCalculationService } from '../shared/services/price-calculation.service';
import { PriceCategory, OptimalTimeDto } from '../shared/models/price.model';

interface EnhancedOptimalTimeDto extends OptimalTimeDto {
  estimatedTotalPriceCents: number;
  potentialSavingsCents: number;
  potentialSavingsPercentage: number;
}

interface EnhancedOptimalScheduleDto {
  now: EnhancedOptimalTimeDto;
  next12Hours: EnhancedOptimalTimeDto;
  extended?: EnhancedOptimalTimeDto;
  defaults: ChargeOptimalScheduleDto['defaults'];
}

interface OptimalScheduleState {
  loading: boolean;
  data: EnhancedOptimalScheduleDto | null;
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
  private readonly priceCalculation = inject(PriceCalculationService);
  private readonly trigger$ = new BehaviorSubject<void>(undefined);

  optimalSchedule$: Observable<OptimalScheduleState> = this.trigger$.pipe(
    switchMap(() =>
      this.chargeEvService.getOptimalSchedule().pipe(
        map((apiData): OptimalScheduleState => {
          // First, calculate the "now" price to use as reference for savings
          const nowPrice = this.priceCalculation.calculateEstimatedTotalPrice(
            apiData.now.pricePoints,
            apiData.defaults
          );

          // Enhance the API response with calculated prices and savings
          const enhancedData: EnhancedOptimalScheduleDto = {
            now: this.priceCalculation.addEstimatedPriceWithSavings(
              apiData.now,
              apiData.defaults,
              nowPrice
            ),
            next12Hours: this.priceCalculation.addEstimatedPriceWithSavings(
              apiData.next12Hours,
              apiData.defaults,
              nowPrice
            ),
            defaults: apiData.defaults
          };

          // Add extended time if it exists
          if (apiData.extended) {
            enhancedData.extended = this.priceCalculation.addEstimatedPriceWithSavings(
              apiData.extended,
              apiData.defaults,
              nowPrice
            );
          }

          return { loading: false, data: enhancedData, error: null };
        }),
        catchError((err): Observable<OptimalScheduleState> => {
          console.error('[ChargeEvComponent] Error fetching optimal schedule:', err);

          const errorMessage = err.userMessage || 'Aikataulun lataaminen epäonnistui';

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

  getOptimalSchedule(): void {
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

  /**
   * Converts cents to euros
   * @param cents - Price in cents
   * @returns Price in euros
   */
  centsToEuros(cents: number): number {
    return cents / 100;
  }
}
