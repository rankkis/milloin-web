import { Component, inject } from '@angular/core';
import { WashLaundryService, WashLaundryOptimalScheduleDto } from './wash-laundry.service';
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
  now?: EnhancedOptimalTimeDto;
  today?: EnhancedOptimalTimeDto;
  tonight?: EnhancedOptimalTimeDto;
  tomorrow?: EnhancedOptimalTimeDto;
  defaults: WashLaundryOptimalScheduleDto['defaults'];
}

interface OptimalScheduleState {
  loading: boolean;
  data: EnhancedOptimalScheduleDto | null;
  error: string | null;
}

@Component({
  selector: 'app-wash-laundry',
  standalone: false,
  templateUrl: './wash-laundry.component.html',
  styleUrl: './wash-laundry.component.scss'
})
export class WashLaundryComponent {
  private readonly washLaundryService = inject(WashLaundryService);
  private readonly priceUtilities = inject(PriceUtilitiesService);
  private readonly priceCalculation = inject(PriceCalculationService);
  private readonly trigger$ = new BehaviorSubject<void>(undefined);

  optimalSchedule$: Observable<OptimalScheduleState> = this.trigger$.pipe(
    switchMap(() =>
      this.washLaundryService.getOptimalSchedule().pipe(
        map((apiData): OptimalScheduleState => {
          // First, calculate the "now" price to use as reference for savings
          const nowPrice = apiData.now
            ? this.priceCalculation.calculateEstimatedTotalPrice(apiData.now.pricePoints, apiData.defaults)
            : 0;

          // Enhance the API response with calculated prices and savings
          const enhancedData: EnhancedOptimalScheduleDto = {
            defaults: apiData.defaults
          };

          // Add estimated total price and savings to each time slot if it exists
          if (apiData.now) {
            enhancedData.now = this.priceCalculation.addEstimatedPriceWithSavings(
              apiData.now,
              apiData.defaults,
              nowPrice
            );
          }
          if (apiData.today) {
            enhancedData.today = this.priceCalculation.addEstimatedPriceWithSavings(
              apiData.today,
              apiData.defaults,
              nowPrice
            );
          }
          if (apiData.tonight) {
            enhancedData.tonight = this.priceCalculation.addEstimatedPriceWithSavings(
              apiData.tonight,
              apiData.defaults,
              nowPrice
            );
          }
          if (apiData.tomorrow) {
            enhancedData.tomorrow = this.priceCalculation.addEstimatedPriceWithSavings(
              apiData.tomorrow,
              apiData.defaults,
              nowPrice
            );
          }

          return { loading: false, data: enhancedData, error: null };
        }),
        catchError((err): Observable<OptimalScheduleState> => {
          console.error('[WashLaundryComponent] Error fetching optimal schedule:', err);

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
}