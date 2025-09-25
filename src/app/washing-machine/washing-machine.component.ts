import { Component, inject } from '@angular/core';
import { WashingMachineService, WashingForecastDto } from './washing-machine.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { switchMap, map, catchError, startWith } from 'rxjs/operators';

interface ForecastState {
  loading: boolean;
  data: WashingForecastDto | null;
  error: string | null;
}

interface SavingsCalculation {
  costCents: number;
  savingsVsTodayCents?: number;
  savingsVsTodayPercentage?: number;
}

enum PriceCategory {
  VERY_CHEAP = 'VERY_CHEAP',
  CHEAP = 'CHEAP',
  NORMAL = 'NORMAL',
  EXPENSIVE = 'EXPENSIVE',
  VERY_EXPENSIVE = 'VERY_EXPENSIVE'
}

@Component({
  selector: 'app-washing-machine',
  standalone: false,
  templateUrl: './washing-machine.component.html',
  styleUrl: './washing-machine.component.scss'
})
export class WashingMachineComponent {
  private readonly washingMachineService = inject(WashingMachineService);
  private readonly trigger$ = new BehaviorSubject<void>(undefined);

  // Washing machine constants
  private readonly ENERGY_CONSUMPTION_KWH = 1.5; // 1.5 kWh per wash
  private readonly TARIFF_PRICE_CENTS_KWH = 6.5; // 6.5 c/kWh tariff price


  forecast$: Observable<ForecastState> = this.trigger$.pipe(
    switchMap(() =>
      this.washingMachineService.getForecast().pipe(
        map((data): ForecastState => ({ loading: false, data, error: null })),
        catchError((err): Observable<ForecastState> => {
          console.error('[WashingMachineComponent] Error fetching forecast:', err);

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

  calculateSavings(timeSlot: any, referencePrice?: number): SavingsCalculation {
    // Price is already in cents/kWh, so just multiply by energy consumption
    const costCents = timeSlot.price * this.ENERGY_CONSUMPTION_KWH;

    if (referencePrice) {
      const referenceCostCents = referencePrice * this.ENERGY_CONSUMPTION_KWH;
      const savingsVsTodayCents = referenceCostCents - costCents;
      const savingsVsTodayPercentage = (savingsVsTodayCents / referenceCostCents) * 100;

      return {
        costCents,
        savingsVsTodayCents: savingsVsTodayCents > 0 ? savingsVsTodayCents : undefined,
        savingsVsTodayPercentage: savingsVsTodayPercentage > 0 ? savingsVsTodayPercentage : undefined
      };
    }

    return { costCents };
  }

  calculateWashCost(timeSlot: any): number {
    return (timeSlot.price + this.TARIFF_PRICE_CENTS_KWH) * this.ENERGY_CONSUMPTION_KWH;
  }

  calculatePotentialSavings(timeSlot: any): { savingsCents: number; savingsPercentage: number } | null {
    if (timeSlot.potentialSavings && timeSlot.potentialSavingsPercentage) {
      // potentialSavings is already in cents/kWh, multiply by energy consumption to get total savings
      const savingsCents = timeSlot.potentialSavings * this.ENERGY_CONSUMPTION_KWH;
      return {
        savingsCents,
        savingsPercentage: timeSlot.potentialSavingsPercentage
      };
    }

    // If API doesn't provide savings but we have an optimal time (rank 1),
    // estimate savings based on the fact that this is an optimal recommendation
    if (timeSlot.rank === 1 && timeSlot.price < 10) { // Assuming prices under 10 c/kWh are good
      const estimatedCurrentPrice = timeSlot.price * 1.5; // Estimate current is 50% higher
      // Include tariff in both prices for accurate total cost comparison
      const estimatedSavingsCents = (estimatedCurrentPrice - timeSlot.price) * this.ENERGY_CONSUMPTION_KWH;
      const estimatedSavingsPercentage = ((estimatedCurrentPrice - timeSlot.price) / (estimatedCurrentPrice + this.TARIFF_PRICE_CENTS_KWH)) * 100;

      if (estimatedSavingsCents > 0.5) { // Only show if savings > 0.5 cents
        return {
          savingsCents: estimatedSavingsCents,
          savingsPercentage: estimatedSavingsPercentage
        };
      }
    }

    return null;
  }

  isCurrentlyOptimalTime(timeSlot: any): boolean {
    if (!timeSlot.startTime || !timeSlot.endTime) {
      return false;
    }

    const now = new Date();
    const startTime = new Date(timeSlot.startTime);
    const endTime = new Date(timeSlot.endTime);

    return now >= startTime && now <= endTime;
  }

  getPriceCategory(price: number): PriceCategory {
    if (price < 2.5) return PriceCategory.VERY_CHEAP;
    if (price < 5.0) return PriceCategory.CHEAP;
    if (price < 10.0) return PriceCategory.NORMAL;
    if (price < 20.0) return PriceCategory.EXPENSIVE;
    return PriceCategory.VERY_EXPENSIVE;
  }

  getPriceCategoryText(price: number): string {
    const category = this.getPriceCategory(price);
    switch (category) {
      case PriceCategory.VERY_CHEAP:
        return 'erittäin halpa';
      case PriceCategory.CHEAP:
        return 'halpa';
      case PriceCategory.NORMAL:
        return 'normaali';
      case PriceCategory.EXPENSIVE:
        return 'kallis';
      case PriceCategory.VERY_EXPENSIVE:
        return 'erittäin kallis';
    }
  }

  shouldRecommendNow(timeSlot: any): boolean {
    const category = this.getPriceCategory(timeSlot.price);
    return this.isCurrentlyOptimalTime(timeSlot) &&
           (category === PriceCategory.VERY_CHEAP || category === PriceCategory.CHEAP);
  }

  getPriceCssClass(price: number): string {
    const category = this.getPriceCategory(price);
    switch (category) {
      case PriceCategory.VERY_CHEAP:
        return 'price-very-cheap';
      case PriceCategory.CHEAP:
        return 'price-cheap';
      case PriceCategory.NORMAL:
        return 'price-normal';
      case PriceCategory.EXPENSIVE:
        return 'price-expensive';
      case PriceCategory.VERY_EXPENSIVE:
        return 'price-very-expensive';
    }
  }

  getPriceEmoji(price: number): string {
    const category = this.getPriceCategory(price);
    switch (category) {
      case PriceCategory.VERY_CHEAP:
        return '👍'; // Thumbs up for very cheap
      case PriceCategory.CHEAP:
        return ''; // No emoji for regular cheap
      case PriceCategory.NORMAL:
        return ''; // No emoji for normal
      case PriceCategory.EXPENSIVE:
        return ''; // No emoji for expensive
      case PriceCategory.VERY_EXPENSIVE:
        return '😭'; // Crying face for very expensive
    }
  }

}